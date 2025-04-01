import { CommandResult, ScriptEventCommandMessageAfterEvent, system, world } from "@minecraft/server"
import { LadatpsResponse } from ".";
import { randomId, between, ControlMessage, Header } from "./functions";
import { byteLength } from "./encoding";

const overworld = world.getDimension('overworld');
const packet_size = 650;
const extend_packet_size = 300;
const max_packet_size = 1850;

type LadatpsRequestOption = {
  response_id?: string,
  header?: {
    mime?: string
    [key: string]: any
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
    let request: Header = {
      response: response_id,
      addition_char: true
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
        }else if(response.status == 221){
          resolve();
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
            // send data
            let last_tick = system.currentTick;
            let count = 0;
            let send_promises: Promise<CommandResult>[] = [];
            for(let i=0; i < data_part.length; i++){
              let isSameTick = last_tick == system.currentTick;

              if(isSameTick && count <= 16){
                system.sendScriptEvent(data_sessionId + i.toString(), request.addition_char?`"${data_part[i]}`:data_part[i]);
                count++;
              }else{
                await system.waitTicks(1);
                count = 0;
              }
              if(!isSameTick) last_tick = system.currentTick;
            }
            await system.waitTicks(1);
            let status_req: ControlMessage = {
              type: "status",
              symbol: 'status_request'
            }
            system.sendScriptEvent(control_sessionId, JSON.stringify(status_req));
          }
        }
      }else{
        let message = JSON.parse(event.message) as LadatpsResponse;
        if(between(message.status, 400, 599)){
          // error message
          console.error(JSON.stringify(message));

        }else if(message.status == 213 && message.header.symbol == 'status_request'){
          if(message.header.length == data_part.length && message.header.loss.length == 0){
            // success
            let disconnect_req: ControlMessage = {
              type: "disconnect"
            }
            system.sendScriptEvent(control_sessionId, JSON.stringify(disconnect_req));
          }else{
            // packet loss
            if(message.header.length != data_part.length){
              // data length is not same
              let sequence = data_part.length-1;
              system.sendScriptEvent(data_sessionId+sequence.toString(), request.addition_char?`"${data_part[sequence]}`:data_part[sequence]);
            }else{
              // resend loss packet
              for(const sequence of message.header.loss){
                system.sendScriptEvent(data_sessionId+sequence.toString(), request.addition_char?`"${data_part[sequence]}`:data_part[sequence]);
              }
            }
            
            let status_req: ControlMessage = {
              type: "status",
              symbol: 'status_request'
            }
            system.sendScriptEvent(control_sessionId, JSON.stringify(status_req));
          }
        }else if(message.status == 221){
          resolve();
        }
      }
    }, {namespaces: [namespace]});

    system.sendScriptEvent(id, JSON.stringify(request));
  });
}