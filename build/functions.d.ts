export declare function randomId(): string;
export declare function randomId_no_duplication(id: string[]): string;
export declare function between(number: number, min: number, max: number): boolean;
export type Session = {
    type: "data" | "control";
    response: string;
    controlId?: string;
    dataId?: string;
    header: Header;
    sessionId: string;
    mime: string;
    data: string[];
};
export type Header = {
    response: string;
    mime?: string;
    addition_char?: boolean;
    [key: string]: any;
};
export type LadatpsRequest = {
    id: string;
    status: number;
    error: string;
    responseHeader: {
        data: string;
        control: string;
        [key: string]: any;
    };
    requestHeader: Header;
};
export type LadatpsResponse = {
    status: number;
    header: {
        data?: string;
        control?: string;
        sequence?: number[];
        length?: number;
        symbol?: string;
        loss?: number[];
        [key: string]: any;
    };
    [key: string]: any;
};
export type ControlMessage = {
    type: "disconnect" | "status";
    symbol?: string;
    [key: string]: any;
};
