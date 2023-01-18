import { Fields } from "./tsv-fields";

const GizmogeneHeader = ["Region number", "Genome", "Genome ID", "Feature ID", "Start", "End", "Length (nt)", "Product length (AA)", "Function", "PATRIC Global Family", "PATRIC Local Family"]

interface GizmogeneDataItems {
  "Region number": string,
  "Genome": string,
  "Genome ID": string,
  "Feature ID": string,
  "Start": string,
  "End": string,
  "Length (nt)": string,
  "Product length (AA)": string,
  "Function": string,
  "PATRIC Global Family": string,
  "PATRIC Local Family": string,
}

export interface GizmogeneData extends Array<GizmogeneDataItems>{}

export function isGizmogeneData(list: GizmogeneDataItems[]): list is GizmogeneData {
  let hasAllProps = true;
  GizmogeneHeader.forEach(val =>{
    if (!Object.prototype.hasOwnProperty.call(list[0], val)){
      hasAllProps = false;
    }
  })
  return hasAllProps;
}

export const GizmogeneFields: Fields = {
        regionName: "Genome",
        featureName: "Function",
        start: "Start",
        stop: "End",
        length: "Length (nt)",
        regionChange: "Region number"
      }
