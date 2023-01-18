import { Fields } from "./tsv-fields";

const SeedHeader = ["Genome", "ID", "Start", "Stop", "Size (nt)", "Strand", "Function", "FC", "SS", "Set"]

interface SeedDataItems {
  "Genome": string,
  "ID": string,
  "Start": string,
  "Stop": string,
  "Size (nt)": string,
  "Strand": string,
  "Function": string,
  "FC": string,
  "SS": string,
  "Set": string
}

export interface SeedData extends Array<SeedDataItems>{}

export function isSeedData(list: SeedDataItems[]): list is SeedData {
  let hasAllProps = true;
  SeedHeader.forEach(val =>{
    if (!Object.prototype.hasOwnProperty.call(list[0], val)){
      hasAllProps = false;
    }
  })
  return hasAllProps;
}

export const SeedFields: Fields = {
        regionName: "Genome",
        featureName: "Function",
        start: "Start",
        stop: "Stop",
        length: "Size (nt)",
        regionChange: "Genome"
      }
