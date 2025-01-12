import { getLogger } from "../logger";
import { AltimeterUnit, DepositType, Descriptive, IMetar, IRunwayInfoDeposit, parseMetar, Phenomenon } from "metar-taf-parser";
import { DisplayData } from "../types";
import { calculateCrosswind, CLOUD_QTY_MAP, WX_MAP } from "./maps";

const HPA_TO_MMHG = 0.75006375541921;
const INHG_TO_HPA = 33.863889532611;

export class Metar {
    private lastMetar: IMetar | null = null;
    private lastMetarAt: Date | null = null;
    private logger = getLogger('metar');

    constructor(
        private airport: string,
        private runway: string
    ) {}

    private formatAsDisplayData(metar: IMetar): DisplayData {
        const response = {
            clouds: {
                height: null as number | null,
                n: null as number | null,
                nh: null as number | null
            },
            events: null as number | null,
            hasIcing: null as boolean | null,
            hasThunder: null as boolean | null,
            wind: {
                heading: null as number | null,
                maxPerpendicularSpeed: null as number | null,
                maxSpeed: null as number | null,
                speed: null as number | null,
            },
            temperature: null as number | null,
            pressure: {
                hPa: null as number | null,
                mmHg: null as number | null,
            },
        } satisfies DisplayData;

        /**
         * Clouds.
         * There is no "overall" cloud coverage (N in BI AIU), so we pick the highest layer as N.
         */
        {
            const layersSorted = metar.clouds
                .filter(cloud => typeof cloud.height === 'number')
                .sort((a, b) => a.height! - b.height!);

            const lowestLayer = layersSorted[0];
            const highestLayer = layersSorted[layersSorted.length - 1];

            if (lowestLayer) {
                response.clouds.height = lowestLayer.height ?? null;
                response.clouds.nh = CLOUD_QTY_MAP.get(lowestLayer.quantity)!
            }

            if (highestLayer) {
                response.clouds.n = CLOUD_QTY_MAP.get(highestLayer.quantity)!
            }
        }

        /**
         * Phenomenons.
         */
        {
            // Sort phenomenons by severity according to BI AIU docs.
            const phenomenas = metar.weatherConditions
                .flatMap(c => c.phenomenons)
                .map(c => WX_MAP.get(c)!)
                .sort((a, b) => b - a);

            response.events = phenomenas[0] ?? null;
        }

        /**
         * Icing.
         * Considering BI AIU only refers to icing, 
         * but not "Contaminated runway" per ICAO Annex 6.
         */
        {
            const rwyDeposits = metar.runwaysInfo
                .filter((rwy): rwy is IRunwayInfoDeposit => {
                    return rwy.name === this.runway &&
                        typeof (rwy as IRunwayInfoDeposit).depositType !== 'undefined';
                });

            if (rwyDeposits.length > 0) {
                response.hasIcing = rwyDeposits.some(r => r.depositType === DepositType.Ice);
            }
        }

        /**
         * Thunder.
         */
        {
            // If no WX conditions are present, set hasThunder to null indicating lack of info.
            if (metar.weatherConditions.length > 0) {
                response.hasThunder = metar.weatherConditions.some(c => 
                    c.descriptive === Descriptive.THUNDERSTORM || 
                    c.phenomenons.includes(Phenomenon.THUNDERSTORM)
                );
            }
        }

        /**
         * Wind.
         */
        {
            if (metar.wind) {
                response.wind.heading = metar.wind.degrees ?? null;
                response.wind.speed = metar.wind.speed ?? null;
                response.wind.maxSpeed = metar.wind.gust ?? null;
            }

            // Crosswind calculation requires exact wind direction.
            // If wind direction is variable, we omit the crosswind calculation to make things simpler.
            if (typeof metar.wind?.degrees !== 'undefined') {
                const rwyHeading = parseInt(this.runway.substring(0, 2), 10) * 10;
                const crosswind = calculateCrosswind(rwyHeading, metar.wind.degrees, metar.wind.gust ?? metar.wind.speed);
                response.wind.maxPerpendicularSpeed = crosswind;
            }
        }

        /**
         * Temperature and Pressure.
         * Humidity is not available in METAR.
         */
        {
            response.temperature = metar.temperature ?? null;
            if (metar.altimeter) {
                switch (metar.altimeter.unit) {
                    case AltimeterUnit.HPa:
                        response.pressure.hPa = metar.altimeter.value;
                        response.pressure.mmHg = metar.altimeter.value * HPA_TO_MMHG;
                        break;

                    case AltimeterUnit.InHg:
                        const hpa = metar.altimeter.value * INHG_TO_HPA;
                        response.pressure.hPa = hpa;
                        response.pressure.mmHg = hpa * HPA_TO_MMHG;
                        break;

                    default:
                        break;
                }
            }
        }

        return response;
    }

    private parseMetarTimestamp(metar: IMetar): Date | null {
        if (
            typeof metar.hour === 'undefined' || 
            typeof metar.minute === 'undefined' || 
            typeof metar.day === 'undefined'
        ) {
            return null;
        }

        const timestamp = new Date();
        timestamp.setDate(metar.day);
        timestamp.setUTCHours(metar.hour);
        timestamp.setUTCMinutes(metar.minute);
        return timestamp;
    }

    async fetch(): Promise<DisplayData | null> {
        if (!this.airport) {
            return null;
        }
        
        // Fetch new METAR data if the last one is older than 30 minutes
        if (this.lastMetar && this.lastMetarAt) {
            const timeSinceLastMetar = Date.now() - this.lastMetarAt.getTime();
            if (timeSinceLastMetar < 1000 * 60 * 30) {
                return this.formatAsDisplayData(this.lastMetar);
            }
        }
        
        const response = await fetch(`https://aviationweather.gov/api/data/metar?ids=${this.airport}&format=raw`)
            .then(response => response.text())
            .then(response => parseMetar(response))
            .catch(error => {
                this.logger.error(`Failed to fetch: ${error}`);
                return null;
            });
        
        if (!response) {
            return null;
        }
        
        const timestamp = this.parseMetarTimestamp(response);
        this.lastMetar = response;
        this.lastMetarAt = timestamp;
        return this.formatAsDisplayData(response);
    }
}
