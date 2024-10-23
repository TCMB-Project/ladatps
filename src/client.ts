import { CommandResult, ScriptEventCommandMessageAfterEvent, system, world } from "@minecraft/server"
import { LadatpsRequest, LadatpsResponse } from ".";
import { randomId, between } from "./functions";
import { byteLength } from "./encoding";

const overworld = world.getDimension('overworld');
const packet_size = 650;
const extend_packet_size = 300;
const max_packet_size = 1850;

export type LadatpsRequestOption = {
  response_id: string,
  header: {
    mime: string
    [key: string]: any
  }
}

async function send_packet(id: string, packet: string): Promise<CommandResult>{
  let sent: boolean = false;
  while(!sent){
    try{
      let result = await overworld.runCommandAsync(`scriptevent ${id} ${packet}`);
      sent = true;

      return result;
    }catch(e){
      await system.waitTicks(2);
    }
  }
}

export function sendData(id: string, data: string, option?: LadatpsRequestOption): Promise<void>{
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
    let namespace = response_id.split(':')[0];
    let connected = false;
    let data_part: string[] = [];
    let data_sessionId: string;
    let control_sessionId: string;

    let se_receive = system.afterEvents.scriptEventReceive.subscribe(async (event)=>{ 
      let response = JSON.parse(event.message) as LadatpsResponse;
      if(!connected){
        if(between(response.status, 400, 599)){
          reject(response);
          system.afterEvents.scriptEventReceive.unsubscribe(se_receive);
          return;
        }else{
          if(response.status == 227){
            connected = true;
            data_sessionId = response.header.data;
            control_sessionId = response.header.control;
            for (let i = 0; i < data.length; i += packet_size) {
              let sliced = data.substring(i, i + packet_size);
              for(let j=0; j<4; j++){
                let extend = data.substring(i + packet_size, i + packet_size + extend_packet_size);
                if(byteLength(sliced) + byteLength(extend) <= max_packet_size){
                  sliced += extend;
                  i += extend_packet_size;
                }
              }
              data_part.push(sliced);
            }
            let last_tick = system.currentTick;
            let count = 0;
            for(let i=0; i < data_part.length; i++){
              let isSameTick = last_tick == system.currentTick;

              if(isSameTick && count <= 4){
                send_packet(data_sessionId + i.toString(), data_part[i]);
                count++;
              }else{
                await system.waitTicks(1);
                last_tick = system.currentTick;
              }
              if(!isSameTick) last_tick = system.currentTick;
            }
          }
        }
      }else{

      }
    }, {namespaces: [namespace]});

    overworld.runCommandAsync(`/scriptevent ${id} ${JSON.stringify(request)}`);
  });
}