import { system, world } from "@minecraft/server";
import { between, randomId_no_duplication } from "./functions";
const overworld = world.getDimension('overworld');
const SEPARATOR = "_-(.)-_";
export class LadatpsServer {
    constructor() {
        this.session = new Map();
        this.sessionId = [];
        this.onRequest = (request) => request;
        this.onReceive = (data) => data;
    }
    onMessage(event) {
        if (event.id == this.listenId) {
            let header;
            try {
                header = JSON.parse(event.message);
                if (typeof header != "object") {
                    console.error(`[${this.listenId}] Invalid Request(Not in JSON format)`);
                    return;
                }
                if (typeof header.response == 'undefined') {
                    console.error(`[${this.listenId}] Invalid Request(header.response is not defined)`);
                    return;
                }
                let session_id = randomId_no_duplication(this.sessionId);
                let data_sessionId = this.listenId + "_" + session_id + "_data";
                let control_sessionId = this.listenId + "_" + session_id + "_ctrl";
                let request = {
                    status: 227,
                    error: '',
                    responseHeader: {
                        data: data_sessionId + SEPARATOR,
                        control: control_sessionId
                    },
                    requestHeader: header
                };
                request = this.onRequest(request);
                //error handling
                if (between(request.status, 400, 599)) {
                    let response = {
                        status: request.status,
                        error: request.error,
                        header: {}
                    };
                    overworld.runCommandAsync(`/scriptevent ${header.response} ${JSON.stringify(response)}`);
                    return;
                }
                this.session.set(data_sessionId, {
                    type: "data",
                    response: header.response,
                    controlId: control_sessionId,
                    header: header,
                    mime: header.mime || 'text/plain',
                    sessionId: session_id,
                    data: []
                });
                this.session.set(control_sessionId, {
                    type: "control",
                    response: header.response,
                    dataId: data_sessionId,
                    header: header,
                    mime: header.mime || 'text/plain',
                    sessionId: session_id,
                    data: []
                });
                let response = {
                    status: request.status,
                    header: request.responseHeader
                };
                overworld.runCommandAsync(`/scriptevent ${header.response} ${JSON.stringify(response)}`);
            }
            catch (error) {
                if (typeof header != "object") {
                    console.error(`[${this.listenId}] Invalid Request(JSON parsing error)\n`, error);
                    return;
                }
            }
        }
        else {
            let eventId = event.id.split(SEPARATOR);
            if (this.session.has(eventId[0])) {
                let session = this.session.get(eventId[0]);
                if (session.type == 'data') {
                    let sequence = Number(eventId[1]);
                    if (isNaN(sequence)) {
                        let response = {
                            status: 501,
                            error: 'invalid sequence number',
                            header: {}
                        };
                        overworld.runCommandAsync(`/scriptevent ${session.response} ${JSON.stringify(response)}`);
                        return;
                    }
                    session.data[sequence] = event.message;
                }
                else if (session.type == 'control') {
                    let message = JSON.parse(event.message);
                    let data_session = this.session.get(session.dataId);
                    if (message.type == "disconnect") {
                        if (data_session.data.includes(undefined)) {
                            let non_receive_index = data_session.data.findIndex((packet) => packet == undefined);
                            let response = {
                                status: 430,
                                error: "Retransmission is required",
                                header: {
                                    sequence: [non_receive_index]
                                }
                            };
                            overworld.runCommandAsync(`/scriptevent ${session.response} ${JSON.stringify(response)}`);
                        }
                        else {
                            this.session.delete(session.dataId);
                            this.session.delete(data_session.controlId);
                            let response = {
                                status: 221,
                                header: {}
                            };
                            overworld.runCommandAsync(`/scriptevent ${session.response} ${JSON.stringify(response)}`);
                            let data = session.data.join('');
                            this.onReceive(session.header, data);
                        }
                    }
                    else if (message.type == 'length') {
                        let response = {
                            status: 213,
                            header: {
                                length: data_session.data.length
                            }
                        };
                        overworld.runCommandAsync(`/scriptevent ${session.response} ${JSON.stringify(response)}`);
                    }
                }
            }
        }
    }
    listen(id) {
        this.listenId = id;
        let namespace = id.split(':')[0];
        system.afterEvents.scriptEventReceive.subscribe((event) => { this.onMessage(event); }, { namespaces: [namespace] });
    }
}
//# sourceMappingURL=server.js.map