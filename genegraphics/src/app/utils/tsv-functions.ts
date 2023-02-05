import { GeneGraphic, TextProps } from '../models';
import { DEFAULT_TEXTPROPS } from './db-functions';

export function parseBool(s: string){
    return s.toLowerCase() == "true" ? true :
      s.toLowerCase() == "false" ? false:
      undefined;
  }

export function parseFeatureProps(item: any[], header: string[]): TextProps {
    let nameProps = DEFAULT_TEXTPROPS;
    let namehtml: string | undefined = item[header.indexOf("namehtml")];
    if (namehtml){
      nameProps.bold = (namehtml.search("<strong>") != -1)? true: false;
      nameProps.italic = (namehtml.search("<em>") != -1)? true : false;
      let font_size_match = namehtml.match(/font-size: (\d+)[pt]?;/)
      if (font_size_match?.at(1)){ nameProps.fontSize = parseInt(font_size_match[1])}
      let color_match = namehtml.match(/color: (#?[\d|A-Z|a-z]+);/)
      if (color_match?.at(1)){ nameProps.color = color_match[1]; }
      let text_align_match = namehtml.match(/text-align: ([a-z|A-Z]+);/)
      if (text_align_match?.at(1)){ nameProps.posHor = text_align_match[1]; }
      let labelvertpos = item[header.indexOf("labelvertpos")];
      nameProps.posVert =  (labelvertpos === "top") ? "above" :
        (labelvertpos === "middle") ? "center" :
          (labelvertpos === "bottom") ? "below" :
            nameProps.posVert;
    }
    return nameProps;
  }

export function parseRegionProps(item: any[], header: string[]): TextProps {
    let nameProps = DEFAULT_TEXTPROPS;
    let genomehtml: string | undefined = item[header.indexOf("genomehtml")];
    if (genomehtml){
      nameProps.bold = (genomehtml.search("<strong>") != -1)? true: false;
      nameProps.italic = (genomehtml.search("<em>") != -1)? true : false;
      let font_size_match = genomehtml.match(/font-size: (\d+)[pt]?;/)
      if (font_size_match?.at(1)){ nameProps.fontSize = parseInt(font_size_match[1])}
      let color_match = genomehtml.match(/color: (#?[\d|A-Z|a-z]+);/)
      if (color_match?.at(1)){ nameProps.color = color_match[1]; }
      let text_align_match = genomehtml.match(/text-align: ([a-z|A-Z]+);/)
      if (text_align_match?.at(1)){ nameProps.posHor = text_align_match[1]; }
    }
    return nameProps;
  }

export function applyGraphSettings(data:Array<Array<any>>, geneGraphic: GeneGraphic) {
  let last_row_first_col = data.at(-1)?.at(0);
  let graphSettings;
  if ((typeof last_row_first_col =="string") && last_row_first_col.startsWith("GraphSettings:")){
    graphSettings = JSON.parse(data.pop()?.at(0)?.replace("GraphSettings:",""));
  }
  if(graphSettings){
    geneGraphic.width = parseInt(graphSettings["graphwidth"]);
    geneGraphic.featureHeight = parseInt(graphSettings["featureheight"]);
    let showScale = parseBool(graphSettings["scaleOn"]);
    if(typeof showScale == 'boolean') geneGraphic.showScale=showScale;
    let multilane = parseBool(graphSettings["multilane"]);
    if(typeof multilane == 'boolean') geneGraphic.multilane=multilane;
    let gaps = parseBool(graphSettings["keepgaps"]);
    if(typeof gaps == 'boolean') geneGraphic.gaps=gaps;
    let overlap = parseBool(graphSettings["shiftgenes"]);
    if(typeof overlap == 'boolean') geneGraphic.overlap=overlap;
    return graphSettings;
  } else {
    return null;
  }
}

export function getFieldInd(header: string[], possible_fields: string[]){
  for (let f of possible_fields){
    let ind = header.indexOf(f);
    if (ind != -1){
      return ind;
    }
  }
  return -1;
}

export function getFieldOrBlank(item: any[], index: number): string{
  if (index == -1){
    return "";
  } else {
    return item[index];
  }
}

export function getIndexes(header: string[]): {}{
    let header_lower = header.map(f=>f.toLowerCase());
    let indexes = {
      start: header_lower.indexOf("start"),
      stop: getFieldInd(header_lower, ["stop", "end"]),
      region_change: getFieldInd(header_lower, ["region number", "genome", "genome id"]),
      region_name: getFieldInd(header_lower, ["genome", "genome id"]),
      feature_name:  header_lower.indexOf("name"),
      genome: header_lower.indexOf("genome"),
      genome_id: header_lower.indexOf("genome id"),
      length: getFieldInd(header_lower, ["size", "size (nt)", "length", "length (nt)"]),
      color: header_lower.indexOf("color"),
      BRC_ID: getFieldInd(header_lower, ["feature id", "id"]),
      product: header_lower.indexOf("function"),
      patric_global: header_lower.indexOf("patric global family"),
      patric_local: header_lower.indexOf("patric local family"),
      product_length: getFieldInd(header_lower, ["product length (aa)", "product length"]),
    }
    if (indexes.start == -1 || indexes.stop ==-1 || indexes.region_change == -1){
      throw new Error("File format unsupported.");
    }
    return indexes;
  }

