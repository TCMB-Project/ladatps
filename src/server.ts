import { ScriptEventCommandMessageAfterEvent, system, world } from "@minecraft/server"
import { between, randomId_no_duplication, Session, LadatpsRequest, Header, LadatpsResponse, ControlMessage } from "./functions"

const overworld = world.getDimension('overworld');
const SEPARATOR = "_-(.)-_"

export class LadatpsServer{
  private listenId: string;
  private session: Map<string, Session> = new Map();
  private sessionId: string[] = [];
  onRequest: (request: LadatpsRequest)=>LadatpsRequest = (request)=>request;
  onReceive: (header, data: string)=>void = (data)=>data;

  private onMessage(event: ScriptEventCommandMessageAfterEvent){
    if(event.id == this.listenId){
      let header: Header;
      try{
        header = JSON.parse(event.message) as Header;
        if(typeof header != "object"){
          console.error(`[${this.listenId}] Invalid Request(Not in JSON format)`);
          return;
        }
        if(typeof header.response == 'undefined'){
          console.error(`[${this.listenId}] Invalid Request(header.response is not defined)`);
          return;
        }

        let session_id = randomId_no_duplication(this.sessionId);
        let data_sessionId = this.listenId+"_"+session_id+"_data";
        let control_sessionId = this.listenId+"_"+session_id+"_ctrl";

        let request: LadatpsRequest = {
          id: event.id,
          status: 227,
          error: '',
          responseHeader: {
            data: data_sessionId+SEPARATOR,
            control: control_sessionId
          },
          requestHeader: header
        }
        request = this.onRequest(request);

        //error handling
        if(between(request.status, 400, 599)){
          let response: LadatpsResponse = {
            status: request.status,
            error: request.error,
            header: {}
          }
          system.sendScriptEvent(header.response, JSON.stringify(response));
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

        let response: LadatpsResponse = {
          status: request.status,
          header: request.responseHeader
        }
        system.sendScriptEvent(header.response, JSON.stringify(response));
      }catch(error){
        if(typeof header != "object"){
          console.error(`[${this.listenId}] Invalid Request(JSON parsing error)\n`, error);
          return;
        }
      }
    }else{
      let eventId = event.id.split(SEPARATOR);
      if(this.session.has(eventId[0])){
        let session = this.session.get(eventId[0]);
        if(session.type == 'data'){
          let sequence = Number(eventId[1]);
          if(isNaN(sequence)){
            let response: LadatpsResponse = {
              status: 501,
              error: 'invalid sequence number',
              header: {}
            }
            system.sendScriptEvent(session.response, JSON.stringify(response));
            return;
          }

          session.data[sequence] = session.header.addition_char?event.message.substring(1):event.message;
        }else if(session.type == 'control'){
          let message = JSON.parse(event.message) as ControlMessage;
          let data_session = this.session.get(session.dataId);
          if(message.type == "disconnect"){
            if(data_session.data.includes(undefined)){
              let non_receive_index = data_session.data.findIndex((packet)=> packet == undefined);
              let response: LadatpsResponse = {
                status: 430,
                error: "Retransmission is required",
                header: {
                  sequence: [non_receive_index],
                  symbol: message.symbol
                }
              }
              system.sendScriptEvent(session.response, JSON.stringify(response));
            }else{
              this.session.delete(session.dataId);
              this.session.delete(data_session.controlId);

              let response: LadatpsResponse = {
                status: 221,
                symbol: message.symbol,
                header: {}
              }
              system.sendScriptEvent(session.response, JSON.stringify(response));

              let data = data_session.data.join('');
              this.onReceive(session.header, data);
            }
          }else if(message.type == 'status'){
            let packet_loss = [];
            for(let i=0; i<data_session.data.length; i++){
              if(!data_session.data[i]) packet_loss.push(i);
            }
            let response: LadatpsResponse = {
              status: 213,
              header: {
                symbol: message.symbol,
                length: data_session.data.length,
                loss: packet_loss
              }
            }
            system.sendScriptEvent(session.response, JSON.stringify(response));
          }
        }
      }
    }
  }

  listen(id: string){
    this.listenId = id;
    let namespace = id.split(':')[0];
    system.afterEvents.scriptEventReceive.subscribe((event)=>{ this.onMessage(event) }, {namespaces: [namespace]});
  }
}