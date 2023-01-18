import { Fields } from "./tsv-fields";

const LegacyHeader = ["genome", "genomehtml", "genelocked", "genomelocked", "labelpos", "labelvertpos", "name", "namehtml", "color", "size", "start", "stop", "strand", "function"]

interface LegacyDataItems {
  "genome": string,
  "genomehtml": string,
  "genelocked": string,
  "genomelocked": string,
  "labelpos": string,
  "labelvertpos": string,
  "name": string,
  "namehtml": string,
  "color": string,
  "size": string,
  "start": string,
  "stop": string,
  "strand": string,
  "function": string
}

export interface LegacyData extends Array<LegacyDataItems>{}

export function isLegacyData(list: LegacyDataItems[]): list is LegacyData {
  let hasAllProps = true;
  LegacyHeader.forEach(val =>{
    if (!Object.prototype.hasOwnProperty.call(list[0], val)){
      hasAllProps = false;
    }
  })
  return hasAllProps;
}

export const LegacyFields: Fields = {
        regionName: "genome",
        featureName: "name",
        start: "start",
        stop: "stop",
        length: "size",
        regionChange: "genome"
      }
