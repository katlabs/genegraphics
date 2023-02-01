import { Injectable } from '@angular/core';
import { DatabaseService, Region, Feature, TextProps } from './database.service';
import { Papa } from 'ngx-papaparse';
import { parseBool } from './utils/tsv-functions';

@Injectable({
  providedIn: 'root'
})
export class TsvParseService {

  constructor(
    private db: DatabaseService,
    private papa: Papa
  ) { }

  private parseFeatureProps(item: any[], header: string[]): TextProps {
    let nameProps = this.db.makeNewTextProps();
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
  private parseRegionProps(item: any[], header: string[]): TextProps {
    let nameProps = this.db.makeNewTextProps();
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

  private getGraphSettings(data:Array<Array<any>>) {
    let last_row_first_col = data.at(-1)?.at(0);
    if ((typeof last_row_first_col =="string") && last_row_first_col.startsWith("GraphSettings:")){
      return JSON.parse(data.pop()?.at(0)?.replace("GraphSettings:",""));
    } else {
      return null;
    }
  }

  private getGenegraphicUpdates(graphSettings: any){
    return graphSettings ?
      {
        width: parseInt(graphSettings["graphwidth"]),
        featureHeight: parseInt(graphSettings["featureheight"]),
        showScale: parseBool(graphSettings["scaleOn"]),
        multilane: parseBool(graphSettings["multilane"]),
        gaps: parseBool(graphSettings["keepgaps"]),
        overlap: !parseBool(graphSettings["shiftgenes"])
      } : null;
  }

  private getIndexes(header: string[]){
    let header_lower = header.map(f=>f.toLowerCase());
    let indexes = {
      start: header_lower.indexOf("start"),
      stop: this.getFieldInd(header_lower, ["stop", "end"]),
      region_change: this.getFieldInd(header_lower, ["region number", "genome", "genome id"]),
      region_name: this.getFieldInd(header_lower, ["genome", "genome id"]),
      feature_name:  header_lower.indexOf("name"),
      genome: header_lower.indexOf("genome"),
      genome_id: header_lower.indexOf("genome id"),
      length: this.getFieldInd(header_lower, ["size", "size (nt)", "length", "length (nt)"]),
      color: header_lower.indexOf("color"),
      BRC_ID: this.getFieldInd(header_lower, ["feature id", "id"]),
      product: header_lower.indexOf("function"),
      patric_global: header_lower.indexOf("patric global family"),
      patric_local: header_lower.indexOf("patric local family"),
      product_length: this.getFieldInd(header_lower, ["product length (aa)", "product length"]),
    }
    if (indexes.start == -1 || indexes.stop ==-1 || indexes.region_change == -1){
      throw new Error("File format unsupported.");
    }
    return indexes;
  }

  private getFieldInd(header: string[], possible_fields: string[]){
    for (let f of possible_fields){
      let ind = header.indexOf(f);
      if (ind != -1){
        return ind;
      }
    }
    return -1;
  }

  private getFieldOrBlank(item: any[], index: number): string{
    if (index == -1){
      return "";
    } else {
      return item[index];
    }
  }

  private parseTSV(geneGraphicId:number, data:Array<Array<any>>, header:string[], regionId_offset:number, regionPos_offset:number): [Region[],Feature[], {} | null]{
    let addRegions: Region[] = [];
    let addFeatures: Feature[] = [];
    let graphSettings = this.getGraphSettings(data);
    let shape = (graphSettings && graphSettings["arrows"] == "false") ? "tag" : "arrow";
    let updateGenegraphic = this.getGenegraphicUpdates(graphSettings);
    let currRegionId = regionId_offset + 1;

    let indexes = this.getIndexes(header);

    data.forEach((item: any[], index: number)=>{
      if(index > 0 && item[indexes.region_change] !== data[index-1][indexes.region_change]){
        currRegionId++;
      }
      let feat_start:number = item[indexes.start];
      let feat_stop:number = item[indexes.stop];
      let feat_first_bp = Math.min(feat_start, feat_stop);
      let feat_last_bp = Math.max(feat_start, feat_stop);
      let lane = 1;
      let length: number;
      try {
        length = parseInt(this.getFieldOrBlank(item, indexes.length))
      } catch {
        length = feat_last_bp-feat_first_bp;
      }
      let color = this.getFieldOrBlank(item, indexes.color);
      if (color == "") color = "#FFFFFF";

      let thisRegion = addRegions.find(r=> r.id === currRegionId);
      if (!thisRegion){
        addRegions.push({
          id: currRegionId,
          geneGraphicId: geneGraphicId,
          name: this.getFieldOrBlank(item, indexes.region_name),
          nameProps: this.parseRegionProps(item, header),
          position: addRegions.length + 1 + regionPos_offset,
          lanes: 1,
          size: feat_last_bp - feat_first_bp,
          start: feat_first_bp,
          stop: feat_last_bp,
          Genome_ID: this.getFieldOrBlank(item, indexes.genome_id),
          Genome_Name: this.getFieldOrBlank(item, indexes.genome),
          Accession: ""
        });
      } else {
        if (thisRegion.size > (feat_first_bp-thisRegion.start) && addFeatures.at(-1)?.lane != 2){
          lane = 2;
          thisRegion.lanes = 2;
        }
        thisRegion.stop = feat_last_bp;
        thisRegion.size = (feat_last_bp - thisRegion.start);
      }

      addFeatures.push({
        regionId: currRegionId,
        name: this.getFieldOrBlank(item, indexes.feature_name),
        nameProps: this.parseFeatureProps(item, header),
        start: feat_start,
        stop: feat_stop,
        length: length,
        shape: shape,
        color1: color,
        lane: lane,
        BRC_ID: this.getFieldOrBlank(item, indexes.BRC_ID),
        Locus_Tag: "",
        Gene_Name: "",
        Gene_ID: "",
        Protein_ID: "",
        Uniprot_Acc: "",
        Product: this.getFieldOrBlank(item, indexes.product),
        PATRIC_Local_Family: this.getFieldOrBlank(item, indexes.patric_local),
        PATRIC_Global_Family: this.getFieldOrBlank(item, indexes.patric_global),
        Product_Length: this.getFieldOrBlank(item, indexes.product_length)
      })
    })

    return [addRegions, addFeatures, updateGenegraphic];
  }

  async parseAndStore(fileContent: string, newSession: boolean){
    const geneGraphicId = await this.db.getOrCreateGeneGraphic(newSession);
    let last_region_id =  await this.db.getLastRegionId();
    const regionId_offset: number = last_region_id ? last_region_id : 0;
    let last_region_pos = await this.db.getLastRegionPosition(geneGraphicId);
    const regionPos_offset: number = last_region_pos ? last_region_pos : 0;
    let result = this.papa.parse(fileContent, {header: false, dynamicTyping: true, skipEmptyLines: true});
    const header = result.data.shift();
    let [addRegions, addFeatures, updateGenegraphic] = this.parseTSV(geneGraphicId, result.data, header, regionId_offset, regionPos_offset);

    if (addRegions.length == 0 || addFeatures.length == 0){
      throw new Error("Unable to parse file.");
    }

    return await this.db.transaction("rw", this.db.geneGraphics, this.db.selectionGroups, this.db.regions, this.db.features, ()=>{
      if (updateGenegraphic){
        this.db.geneGraphics.update(geneGraphicId, updateGenegraphic);
      }
      this.db.regions.bulkAdd(addRegions);
      this.db.features.bulkAdd(addFeatures);
    });
  }
}
