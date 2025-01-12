import {Logger} from "tslog";

export function getLogger<T>(facility?: string): Logger<T> {
    return new Logger<T>({
        name: facility ?? 'main',
        type: "pretty",
        minLevel: process.argv.includes("--debug") ? 2 : 3
    });
}