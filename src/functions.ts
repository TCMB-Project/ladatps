export function randomId(): string{
  let time = new Date().getTime().toString(16).padStart(14, '0');
  let random = Math.floor(Math.random() * 2097152).toString(16).padStart(6, '0');
  return time + random;
}

export function randomId_no_duplication(id: string[]): string{
  while(true){
    let random = randomId();
    if(!id.includes(random)){
      return random;
    }
  }
}

export function between(number: number, min: number, max: number): boolean{
  return number >= min && number <= max;
}

export type Session = {
  type: "data" | "control",
  response: string,
  controlId?: string,
  dataId?: string,
  header: Header
  sessionId: string,
  mime: string,
  data: string[]
}

export type Header = {
  response: string,
  mime?: string,
  addition_char?: boolean,
  [key: string]: any
}

export type LadatpsRequest = {
  id: string,
  status: number
  error: string  
  responseHeader: {
    data: string,
    control: string,
    [key: string]: any
  }
  requestHeader: Header
}
export type LadatpsResponse = {
  status: number,
  header: {
    data?: string,
    control?: string,
    sequence?: number[]
    length?: number
    symbol?: string
    loss?: number[]
    [key: string]: any
  }
  [key: string]: any
}
export type ControlMessage = {
  type: "disconnect" | "status"
  symbol?: string
  [key: string]: any
}