import mqtt from "mqtt";
import dotenv from "dotenv";
import fs from "fs";
import {getLogger} from "./logger";
import cron from "node-cron";
import {DisplayData} from "./types";
import {PrometheusDriver} from "prometheus-query";

dotenv.config();

const logger = getLogger();

const CA_CERTIFICATE_PATH = process.env.CA_CERTIFICATE_PATH ?? 'ca-cert.pem';
const MQTT_URL = process.env.MQTT_URL ?? 'mqtts://b4ck:b4ck@mqtt.internal.0x08.in';
const TAXI_PRICE_METRICS = (process.env.TAXI_PRICE_METRICS ?? '').split(";");
const PROMETHEUS_ENDPOINT = process.env.PROMETHEUS_ENDPOINT ?? 'http://prometheus:9090';

const client = mqtt.connect(MQTT_URL, {
    ca: [fs.readFileSync(CA_CERTIFICATE_PATH)]
});

let fetching = false;

async function sendDisplayData(data: DisplayData): Promise<void> {
    await client.publishAsync("bus/services/meteo-display/data", JSON.stringify(data));
}

async function fetchDisplayDataAsync(): Promise<void> {
    const prometheusClient = new PrometheusDriver({
        endpoint: PROMETHEUS_ENDPOINT
    })
    const taxiPriceMetrics: number[] = [];
    for (const metric of TAXI_PRICE_METRICS) {
        const result = await prometheusClient.instantQuery(metric);
        if (result.resultType !== "vector") {
            continue;
        }
        taxiPriceMetrics.push(result.result[0].value.value);
    }

    await sendDisplayData({
        unitId: 7,

        visibility: {
            s: taxiPriceMetrics[0] ?? null,
            l1: taxiPriceMetrics[1] ?? null,
            l2: taxiPriceMetrics[2] ?? null,
            l3: taxiPriceMetrics[3] ?? null
        }
    });
}

function fetchDisplayData() {
    if (fetching) {
        return;
    }
    fetching = true;
    fetchDisplayDataAsync().catch(e => {
        logger.error(`Failed to update display: ${e}`);
    }).finally(() => {
        fetching = false;
    })
}

fetchDisplayData();

cron.schedule("*/15 * * * * *", () => {
    fetchDisplayData();
});

client.on('connect', () => {
    logger.info('Connected to mqtt');
});

client.on('error', e => {
    logger.error(`MQTT error: ${e}`);
});
