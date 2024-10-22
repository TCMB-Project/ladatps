export { LadatpsServer } from "./server";
export { LadatpsResponse } from "./functions";
export { sendData } from "./client"

export type LadatpsRequest = {
  response: string,
  mime?: string,
  [key: string]: any
}