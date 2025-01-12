import { CloudQuantity, Phenomenon, type IMetar } from "metar-taf-parser";

export enum DisplayPhenomena {
    No = 0,
    Fog = 1,
    Haze = 2,
    Hail = 3,
    Rain = 4,
    Snow = 5,
    DustStorm = 6,
    SnowStorm = 7,
    DistantThunderstorm = 8,
}

/**
 * METAR Sky Conditions to BI AIU Cloud Layer index
 */
export const CLOUD_QTY_MAP = new Map<CloudQuantity, number>([
    [CloudQuantity.BKN, 6],
    [CloudQuantity.FEW, 2],
    [CloudQuantity.SCT, 4],
    [CloudQuantity.OVC, 10],
    [CloudQuantity.NSC, 0],
    [CloudQuantity.SKC, 0]
]);

/**
 * METAR Weather Phenomenon to BI AIU condition index
 */
export const WX_MAP = new Map<Phenomenon, DisplayPhenomena>([
    [Phenomenon.RAIN, DisplayPhenomena.Rain],
    [Phenomenon.DRIZZLE, DisplayPhenomena.Rain],
    [Phenomenon.SNOW, DisplayPhenomena.Snow],
    [Phenomenon.SNOW_GRAINS, DisplayPhenomena.Snow],
    [Phenomenon.ICE_PELLETS, DisplayPhenomena.Hail],
    [Phenomenon.ICE_CRYSTALS, DisplayPhenomena.Snow],
    [Phenomenon.HAIL, DisplayPhenomena.Hail],
    [Phenomenon.SMALL_HAIL, DisplayPhenomena.Hail],
    [Phenomenon.UNKNOW_PRECIPITATION, DisplayPhenomena.No],
    [Phenomenon.FOG, DisplayPhenomena.Fog],
    [Phenomenon.MIST, DisplayPhenomena.Fog],
    [Phenomenon.HAZE, DisplayPhenomena.Haze],
    [Phenomenon.WIDESPREAD_DUST, DisplayPhenomena.DustStorm],
    [Phenomenon.SMOKE, DisplayPhenomena.Haze],
    [Phenomenon.SAND, DisplayPhenomena.DustStorm],
    [Phenomenon.SPRAY, DisplayPhenomena.Rain],
    [Phenomenon.SQUALL, DisplayPhenomena.DistantThunderstorm],
    [Phenomenon.SAND_WHIRLS, DisplayPhenomena.DustStorm],
    [Phenomenon.THUNDERSTORM, DisplayPhenomena.DistantThunderstorm],
    [Phenomenon.DUSTSTORM, DisplayPhenomena.DustStorm],
    [Phenomenon.SANDSTORM, DisplayPhenomena.DustStorm],
    [Phenomenon.FUNNEL_CLOUD, DisplayPhenomena.DistantThunderstorm],
    [Phenomenon.NO_SIGNIFICANT_WEATHER, DisplayPhenomena.No],

    // Well... let's just say it's a dust storm
    [Phenomenon.VOLCANIC_ASH, DisplayPhenomena.DustStorm],
]);

/**
 * Calculate crosswind LHS component for a given runway and wind
 * @param heading Heading of the runway
 * @param direction Heading of the wind
 * @param speed Speed of the wind (units don't matter)
 * @returns Crosswind component in the same units as the wind speed
 */
export function calculateCrosswind(heading: number, direction: number, speed: number): number {
    const angle = Math.abs(heading - direction) % 360;
    const angleRad = angle * Math.PI / 180;
    return Math.round(Math.sin(angleRad) * speed);
}
