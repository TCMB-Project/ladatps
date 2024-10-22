import { system, world } from "@minecraft/server";
import { randomId, between } from "./functions";
const overworld = world.getDimension('overworld');
export function sendData(id, data, option) {
    return new Promise((resolve, reject) => {
        let response_id;
        if (typeof option == "object" && option.response_id) {
            response_id = option.response_id;
        }
        else {
            response_id = randomId() + ':' + randomId() + randomId();
        }
        let request = {
            response: response_id
        };
        if (typeof option == "object" && option.header) {
            request = Object.assign(request, option.header);
        }
        let namespace = response_id.split(':')[0];
        let connected = false;
        let se_receive = system.afterEvents.scriptEventReceive.subscribe((event) => {
            let response = JSON.parse(event.message);
            if (!connected) {
                if (between(response.status, 400, 599)) {
                    reject(JSON.parse(event.message));
                    system.afterEvents.scriptEventReceive.unsubscribe(se_receive);
                    return;
                }
                else {
                    if (response.status == 227) {
                        connected = true;
                    }
                }
            }
            else {
            }
        }, { namespaces: [namespace] });
        overworld.runCommandAsync(`/scriptevent ${id} ${JSON.stringify(request)}`);
    });
}
//# sourceMappingURL=client.js.map