import { ScriptEventCommandMessageAfterEvent, system, world } from "@minecraft/server"
import { LadatpsRequest } from ".";
import { randomId } from "./functions";


const overworld = world.getDimension('overworld');

export type LadatpsRequestOption = {
  response_id: string,
  header: {
    [key: string]: any
  }
}

export function sendData(id: string, data: string, option?: LadatpsRequestOption){
  return new Promise((resolve, reject)=>{
    let response_id: string;
    if(typeof option == "object" && option.response_id){
      response_id = option.response_id;
    }else{
      response_id = randomId()+':'+randomId()+randomId();
    }
    let request: LadatpsRequest = {
      response: response_id
    }
    if(typeof option == "object" && option.header){
      request = Object.assign(request, option.header);
    }
    overworld.runCommandAsync(`/scriptevent ${response_id} ${JSON.stringify(request)}`);
  });
}