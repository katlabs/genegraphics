
export interface Fields {
  regionName: string,
  featureName: string,
  start: string,
  stop: string,
  length: string,
  regionChange: string
}


interface FieldOptions {
  regionName: string[],
  featureName: string[],
  start: string[],
  stop: string[],
  length: string[],
  regionChange: string[]
}

const unknownFileFields: FieldOptions = {
      regionName: ["Genome",  "genome", "Genome ID"],
      featureName: ["Function", "ID", "Feature ID", "PATRIC Local Family", "PATRIC Global Family"],
      start: ["Start", "start"],
      stop: ["Stop", "End", "stop", "end"],
      length: ["Length (nt)", "Size (nt)", "size"],
      regionChange: ["Region name", "Genome",  "genome", "Genome ID"]
}

export function getUnknownFieldNames(fields: string[]): any{
  let requiredFieldNames: any = {}
  for (const [key, val] of Object.entries(unknownFileFields)){
    let fieldName = val.find((f:string)=>{
      return fields.includes(f);
    })
    if (fieldName){
      requiredFieldNames[key] = fieldName;
    } else {
      throw new Error("Could not find required field ${key}");
    }
  }
  return requiredFieldNames;
}


