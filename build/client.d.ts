type LadatpsRequestOption = {
    response_id?: string;
    header?: {
        mime?: string;
        [key: string]: any;
    };
};
export declare function sendData(id: string, data: string, option?: LadatpsRequestOption): Promise<void>;
export {};
