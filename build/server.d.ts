import { LadatpsRequest } from "./functions";
export declare class LadatpsServer {
    private listenId;
    private session;
    private sessionId;
    onRequest: (request: LadatpsRequest) => LadatpsRequest;
    onReceive: (header: any, data: string) => void;
    private onMessage;
    listen(id: string): void;
}
