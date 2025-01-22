import {DisplayData} from "../types";
import {PrometheusDriver} from "prometheus-query";
import {getLogger} from "../logger";

export class Taxi {
    private logger = getLogger("taxi");

    constructor(private readonly metrics: string[], private readonly prometheusClient: PrometheusDriver) {
    }

    async fetch(): Promise<DisplayData> {
        let taxiPriceMetrics: number[] = [];

        try {
            for (const metric of this.metrics) {
                const result = await this.prometheusClient.instantQuery(metric);
                if (result.resultType !== "vector") {
                    continue;
                }
                taxiPriceMetrics.push(result.result[0].value.value);
            }
        } catch (e) {
            console.info(e);
            this.logger.error(`Failed to fetch metrics: ${e}`);
            taxiPriceMetrics = [];
        }

        return {
            visibility: {
                s: taxiPriceMetrics[0] ?? null,
                l1: taxiPriceMetrics[1] ?? null,
                l2: taxiPriceMetrics[2] ?? null,
                l3: taxiPriceMetrics[3] ?? null
            }
        }
    }
}
