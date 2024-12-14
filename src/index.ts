export { LadatpsServer } from "./server";
export { LadatpsResponse, LadatpsRequest } from "./functions";
//export { TextDecoder, TextEncoder, byteLength } from "./encoding"
export { sendData } from "./client"

export type LadatpsRequestHeader = {
  response: string,
  mime?: string,
  [key: string]: any
}