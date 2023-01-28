export function parseBool(s: string){
    return s.toLowerCase() == "true" ? true :
      s.toLowerCase() == "false" ? false:
      null;
  }

