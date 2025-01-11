import mqtt from "mqtt";
import dotenv from "dotenv";
import fs from "fs";
import {getLogger} from "./logger";
import cron from "node-cron";
import {DisplayData} from "./types";

dotenv.config();

const logger = getLogger();

const CA_CERTIFICATE_PATH = process.env.CA_CERTIFICATE_PATH ?? 'ca-cert.pem';
const MQTT_URL = process.env.MQTT_URL ?? 'mqtts://b4ck:b4ck@mqtt.internal.0x08.in';

const client = mqtt.connect(MQTT_URL, {
    ca: [fs.readFileSync(CA_CERTIFICATE_PATH)]
});

let displayUpdating = false;

async function sendDisplayData(data: DisplayData): Promise<void> {
    await client.publishAsync("bus/services/meteo-display/data", JSON.stringify(data));
}

async function updateDisplayAsync(): Promise<void> {
    const time = new Date();

    await sendDisplayData({
        hours: time.getHours(),
        minutes: time.getMinutes(),
    });
}

function updateDisplay() {
    if (displayUpdating) {
        return;
    }
    displayUpdating = true;
    updateDisplayAsync().catch(e => {
        logger.error(`Failed to update display: ${e}`);
    }).finally(() => {
        displayUpdating = false;
    })
}

cron.schedule("* * * * *", () => {
    updateDisplay();
});

client.on('connect', () => {
    logger.info('Connected to mqtt');
});

client.on('error', e => {
    logger.error(`MQTT error: ${e}`);
});
