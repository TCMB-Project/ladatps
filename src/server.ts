import { ScriptEventCommandMessageAfterEvent, system, world } from "@minecraft/server"
import { between, randomId_no_duplication } from "./functions"

type Session = {
  type: "data" | "disconnect"
  disconnectId?: string
  dataId?: string
  sessionId: string
  mime: string
  data: string[]
}
type Header = {
  response: string,
  mime?: string
  [key: string]: any
}
export type LadatpsRequest = {
  status: number
  responseHeader: {
    data: string,
    end: string,
    [key: string]: any
  }
  requestHeader: Header
}
export type LadatpsResponse = {
  status: number
  header: {
    data?: string
    end?: string
    [key: string]: any
  }
  [key: string]: any
}

const overworld = world.getDimension('overworld');

export class LadatpsServer{
  private listenId: string;
  private session: Map<string, Session> = new Map();
  private sessionId: string[] = [];
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
        let request: LadatpsRequest = {
          status: 227,
          responseHeader: {
            data: this.listenId+"_"+session_id+"_data",
            end: this.listenId+"_"+session_id+"_end"
          },
          requestHeader: header
        }
        request = this.onRequest(request);

        //error handling
        if(between(request.status, 400, 599)){
          let response: LadatpsResponse = {
            status: request.status,
            header: {}
          }
          overworld.runCommandAsync(`/scriptevent ${header.response} ${JSON.stringify(response)}`);
          return;
        }

        this.session.set(request.responseHeader.data, {
          type: "data",
          disconnectId: request.responseHeader.end,
          mime: header.mime || 'text/plain',
          sessionId: session_id,
          data: []
        });
        this.session.set(request.responseHeader.data, {
          type: "disconnect",
          dataId: request.responseHeader.data,
          mime: header.mime || 'text/plain',
          sessionId: session_id,
          data: []
        });

        let response: LadatpsResponse = {
          status: request.status,
          header: request.responseHeader
        }
        overworld.runCommandAsync(`/scriptevent ${header.response} ${JSON.stringify(response)}`);
      }catch(error){
        if(typeof header != "object"){
          console.error(`[${this.listenId}] Invalid Request(JSON parsing error)\n`, error);
          return;
        }
      }
    }else if(this.session.has(event.id)){

    }
  }
  onRequest: (request: LadatpsRequest)=>LadatpsRequest;

  listen(id: string){
    this.listenId = id;
    let namespace = id.split(':')[0];
    system.afterEvents.scriptEventReceive.subscribe((event)=>{ this.onMessage(event) }, {namespaces: [namespace]});
  }
}