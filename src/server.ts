import { ScriptEventCommandMessageAfterEvent, system } from "@minecraft/server"

export class LadatpsServer{
  onRequest: (header: {[key: string]: any}, reject: ()=>void)=>any
  listen(id: string){
  }
}