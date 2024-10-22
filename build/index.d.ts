export { LadatpsServer, LadatpsResponse } from "./server";
export { sendData } from "./client";
export type LadatpsRequest = {
    response: string;
    mime?: string;
    [key: string]: any;
};
