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