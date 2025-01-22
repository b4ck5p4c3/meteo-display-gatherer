import {PrometheusDriver} from "prometheus-query";
import {DisplayData} from "../types";
import {getLogger} from "../logger";

export class TrafficJams {
    private logger = getLogger("traffic-jams");

    constructor(private readonly metric: string, private readonly prometheusClient: PrometheusDriver) {
    }

    async fetch(): Promise<DisplayData> {
        try {
            const result = await this.prometheusClient.instantQuery(this.metric);
            if (result.resultType !== "vector") {
                return {
                    unitId: null
                };
            }
            const level = result.result[0].value.value;
            if (level >= 10) {
                return {
                    unitId: 9
                };
            }
            if (level >= 0 && level <= 9) {
                return {
                    unitId: level
                }
            }
            if (!level) {
                return {
                    unitId: null
                }
            }
            this.logger.error(`Incorrect value for metric: ${level}`);
            return {
                unitId: null
            }
        } catch (e) {
            this.logger.error(`Failed to fetch taxi metrics: ${e}`);
            return {
                unitId: null
            };
        }
    }
}
