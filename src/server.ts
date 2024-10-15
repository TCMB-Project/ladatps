import { ScriptEventCommandMessageAfterEvent, system } from "@minecraft/server"

type Session = {
  type: "data" | "disconnect"
  disconnectId: string
  mime: string
  data: string[]
}
type Header = {
  response: string,
  [key: string]: any
}
export type LadatpsRequest = {
  status: number
  header: Header
}

export class LadatpsServer{
  private listenId: string;
  private session: Map<string, Session> = new Map();
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
      }catch(error){
        if(typeof header != "object"){
          console.error(`[${this.listenId}] Invalid Request(JSON parsing error)\n`, error);
          return;
        }
      }
    }
  }
  onRequest: (request: LadatpsRequest)=>any;

  listen(id: string){
    this.listenId = id;
    let namespace = id.split(':')[0];
    system.afterEvents.scriptEventReceive.subscribe((event)=>{ this.onMessage(event) }, {namespaces: [namespace]});
  }
}