import mqtt from "mqtt";
import dotenv from "dotenv";
import fs from "fs";
import {getLogger} from "./logger";
import cron from "node-cron";
import {DisplayData} from "./types";
import {PrometheusDriver} from "prometheus-query";
import { Metar } from "./metar";
import {Taxi} from "./taxi";
import {TrafficJams} from "./traffic-jams";

dotenv.config();

const logger = getLogger();

const CA_CERTIFICATE_PATH = process.env.CA_CERTIFICATE_PATH ?? 'ca-cert.pem';
const MQTT_URL = process.env.MQTT_URL ?? 'mqtts://b4ck:b4ck@mqtt.internal.0x08.in';
const TAXI_PRICE_METRICS = (process.env.TAXI_PRICE_METRICS ?? '').split(";");
const TRAFFIC_JAMS_METRIC = (process.env.TRAFFIC_JAMS_METRIC ?? 'traffic_jam_level{region="saint-petersburg"}');
const PROMETHEUS_ENDPOINT = process.env.PROMETHEUS_ENDPOINT ?? 'http://prometheus:9090';
const METAR_LOCATION = process.env.METAR_LOCATION ?? null;
const METAR_RWY = process.env.METAR_RWY ?? null;

const client = mqtt.connect(MQTT_URL, {
    ca: [fs.readFileSync(CA_CERTIFICATE_PATH)]
});

let fetching = false;

const metar = (METAR_LOCATION && METAR_RWY) 
    ? new Metar(METAR_LOCATION, METAR_RWY) 
    : undefined;

const prometheusClient = new PrometheusDriver({
    endpoint: PROMETHEUS_ENDPOINT
})

const taxi = new Taxi(TAXI_PRICE_METRICS, prometheusClient);
const trafficJams = new TrafficJams(TRAFFIC_JAMS_METRIC, prometheusClient);

async function sendDisplayData(data: DisplayData): Promise<void> {
    await client.publishAsync("bus/services/meteo-display/data", JSON.stringify(data));
}

async function fetchDisplayDataAsync(): Promise<void> {
    const metarReport = await metar?.fetch();
    const taxiReport = await taxi.fetch();
    const trafficJamsReport = await trafficJams.fetch();

    await sendDisplayData({
        ...trafficJamsReport,
        ...taxiReport,
        ...metarReport,
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
