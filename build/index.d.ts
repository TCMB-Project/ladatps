export { LadatpsServer, LadatpsResponse } from "./server";
export type LadatpsRequest = {
    response: string;
    mime?: string;
    [key: string]: any;
};
