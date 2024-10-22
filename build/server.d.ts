type Header = {
    response: string;
    mime?: string;
    [key: string]: any;
};
type LadatpsRequest = {
    status: number;
    error: string;
    responseHeader: {
        data: string;
        end: string;
        [key: string]: any;
    };
    requestHeader: Header;
};
export type LadatpsResponse = {
    status: number;
    header: {
        data?: string;
        end?: string;
        sequence?: number[];
        [key: string]: any;
    };
    [key: string]: any;
};
export declare class LadatpsServer {
    private listenId;
    private session;
    private sessionId;
    onRequest: (request: LadatpsRequest) => LadatpsRequest;
    onReceive: (header: any, data: string) => void;
    private onMessage;
    listen(id: string): void;
}
export {};
