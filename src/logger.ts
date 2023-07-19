export const winstonLogger = require("winston-color");
export const logger = {
    info: (msg: string) => {
        winstonLogger.info(`${timeFormatted()} ${msg}`);
    },
    error: (msg: string) => {
        winstonLogger.err(`${timeFormatted()} ${msg}`);
    }
}

const timeFormatted = () => {
    return new Date().toTimeString().substring(0, 8);
}