export { LadatpsServer } from "./server";
export { LadatpsResponse } from "./functions";
//export { TextDecoder, TextEncoder, byteLength } from "./encoding"
export { sendData } from "./client"

export type LadatpsRequest = {
  response: string,
  mime?: string,
  [key: string]: any
}