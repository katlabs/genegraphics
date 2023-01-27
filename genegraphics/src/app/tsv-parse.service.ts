import { Injectable } from '@angular/core';
import { DatabaseService, GeneGraphic, Region, Feature, TextProps } from './database.service';
import { Papa } from 'ngx-papaparse';
import { GizmogeneHeader, SeedHeader, LegacyHeader } from './utils/tsv-headers';

@Injectable({
  providedIn: 'root'
})
export class TsvParseService {

  constructor(
    private db: DatabaseService,
    private papa: Papa
  ) { }

  private async getOrCreateGeneGraphic(newSession: boolean){
    let geneGraphicId!: number;
    if (newSession){
       geneGraphicId = await this.db.addNewGeneGraphic();
    } else {
      await this.db.geneGraphics.orderBy('opened').last().then(val=>{
        if(val?.id){
          geneGraphicId = val.id
        }
      })
    }
    if (!geneGraphicId){
      throw new Error('Cannot retrieve id of the GeneGraphic');
    }
    return geneGraphicId;
  }

  private async getRegionOffsets(geneGraphicId:number): Promise<[number,number]> {
    let allRegions = await this.db.regions.orderBy('id').toArray()
    let lastRegion = allRegions.at(-1);
    let regionId_offset = lastRegion?.id ? lastRegion.id : 0;
    let regionPos_offset = allRegions.reduce((acc, cur) => cur.geneGraphicId === geneGraphicId ? ++acc : acc, 0);

    return [regionId_offset, regionPos_offset];
  }

  private headersEqual(a: string[], b: string[]): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    let a_sorted = [...a].sort();
    let b_sorted = [...b].sort();

    for (var i = 0; i < a_sorted.length; ++i) {
      if (a_sorted[i] !== b_sorted[i]) return false;
    }
    return true;
  }


  private getIndexOrBlank(header: string[], name: string, item: any[]){
    let val = item[header.indexOf(name)];
    return val ? String(val) : "";
  }

  private parseBool(s: string){
    return s.toLowerCase() == "true" ? true :
      s.toLowerCase() == "false" ? false:
      null;
  }

  private parseFeatureProps(item: any[], header: string[]): TextProps {
    let nameProps = this.db.makeNewTextProps();
    let namehtml: string = item[header.indexOf("namehtml")];
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
    return nameProps;
  }
  private parseRegionProps(item: any[], header: string[]): TextProps {
    let nameProps = this.db.makeNewTextProps();
    let genomehtml: string = item[header.indexOf("genomehtml")];
    nameProps.bold = (genomehtml.search("<strong>") != -1)? true: false;
    nameProps.italic = (genomehtml.search("<em>") != -1)? true : false;
    let font_size_match = genomehtml.match(/font-size: (\d+)[pt]?;/)
    if (font_size_match?.at(1)){ nameProps.fontSize = parseInt(font_size_match[1])}
    let color_match = genomehtml.match(/color: (#?[\d|A-Z|a-z]+);/)
    if (color_match?.at(1)){ nameProps.color = color_match[1]; }
    let text_align_match = genomehtml.match(/text-align: ([a-z|A-Z]+);/)
    if (text_align_match?.at(1)){ nameProps.posHor = text_align_match[1]; }
    return nameProps;
  }

  private parseGizmogene(geneGraphicId:number, data:Array<Array<any>>, header:string[], regionId_offset:number, regionPos_offset:number): [Region[], Feature[]]{
    let addRegions: Region[] = [];
    let addFeatures: Feature[] = [];
    let currRegionId = regionId_offset + 1;

    data.forEach((item: any[], index: number)=>{
      if ( index > 0 && item[header.indexOf("Region number")] !== data[index-1][header.indexOf("Region number")]){
        currRegionId++;
      }
      let feat_start = item[header.indexOf("Start")];
      let feat_stop = item[header.indexOf("End")];
      let feat_first_bp = Math.min(feat_start, feat_stop);
      let feat_last_bp = Math.max(feat_start, feat_stop);
      let lane = 1;

      let thisRegion = addRegions.find(r=> r.id === currRegionId);
      if (!thisRegion){
        addRegions.push({
          id: currRegionId,
          geneGraphicId: geneGraphicId,
          name: item[header.indexOf("Genome")],
          nameProps: this.db.makeNewTextProps(),
          position: addRegions.length + 1 + regionPos_offset,
          lanes: 1,
          size: feat_last_bp - feat_first_bp,
          offset: feat_first_bp,
          data: {
            "Genome": this.getIndexOrBlank(header, "Genome", item),
            "Genome ID": this.getIndexOrBlank(header, "Genome ID", item)
          }
        });
      } else {
        if (thisRegion.size > (feat_first_bp-thisRegion.offset) && addFeatures.at(-1)?.lane != 2){
          lane = 2;
          thisRegion.lanes = 2;
        }
        thisRegion.size = (feat_last_bp - thisRegion.offset);
      }

      addFeatures.push({
        regionId: currRegionId,
        name: "",
        nameProps: this.db.makeNewTextProps(),
        start: feat_start,
        stop: feat_stop,
        length: item[header.indexOf("Length (nt)")],
        shape: "arrow",
        colors: ["#FFFFFF"],
        lane: lane,
        data: {
          "Feature ID": this.getIndexOrBlank(header, "Feature ID", item),
          "Product length (AA)": this.getIndexOrBlank(header, "Product length (AA)", item),
          "Function": this.getIndexOrBlank(header, "Function", item),
          "PATRIC Global Family": this.getIndexOrBlank(header, "PATRIC Global Family", item),
          "PATRIC Local Family": this.getIndexOrBlank(header, "PATRIC Local Family", item),
          "E value": this.getIndexOrBlank(header, "E value", item),
          "% identity":this.getIndexOrBlank(header, "% identity", item)
        }
      })
    })
    return [addRegions, addFeatures];
  }

  private parseSeed(geneGraphicId:number, data:Array<Array<any>>, header:string[], regionId_offset:number, regionPos_offset:number): [Region[], Feature[]]{
    let addRegions: Region[] = [];
    let addFeatures: Feature[] = [];
    let currRegionId = regionId_offset + 1;

    data.forEach((item: any[], index: number)=>{
      if ( index > 0 && item[header.indexOf("Genome")] !== data[index-1][header.indexOf("Genome")]){
        currRegionId++;
      }
      let feat_start = item[header.indexOf("Start")];
      let feat_stop = item[header.indexOf("Stop")];
      let feat_first_bp = Math.min(feat_start, feat_stop);
      let feat_last_bp = Math.max(feat_start, feat_stop);
      let lane = 1;

      let thisRegion = addRegions.find(r=> r.id === currRegionId);
      if (!thisRegion){
        addRegions.push({
          id: currRegionId,
          geneGraphicId: geneGraphicId,
          name: item[header.indexOf("Genome")],
          nameProps: this.db.makeNewTextProps(),
          position: addRegions.length + 1 + regionPos_offset,
          lanes: 1,
          size: feat_last_bp - feat_first_bp,
          offset: feat_first_bp,
          data: {
            "Genome": this.getIndexOrBlank(header, "Genome", item)
          }
        });
      } else {
        if (thisRegion.size > (feat_first_bp-thisRegion.offset) && addFeatures.at(-1)?.lane != 2){
          lane = 2;
          thisRegion.lanes = 2;
        }
        thisRegion.size = (feat_last_bp - thisRegion.offset);
      }

      addFeatures.push({
        regionId: currRegionId,
        name: "",
        nameProps: this.db.makeNewTextProps(),
        start: feat_start,
        stop: feat_stop,
        length: item[header.indexOf("Size (nt)")],
        shape: "arrow",
        colors: ["#FFFFFF"],
        lane: lane,
        data: {
          "ID": this.getIndexOrBlank(header, "ID", item),
          "Strand": this.getIndexOrBlank(header, "Strand", item),
          "Function": this.getIndexOrBlank(header, "Function", item),
          "FC": this.getIndexOrBlank(header, "FC", item),
          "SS": this.getIndexOrBlank(header, "SS", item),
          "Set": this.getIndexOrBlank(header, "Set", item)
        }
      })
    })
    return [addRegions, addFeatures];
  }
  private parseLegacy(geneGraphicId:number, data:Array<Array<any>>, header:string[], regionId_offset:number, regionPos_offset:number): [Region[], Feature[], {} | null ]{
    let graphSettings = data.at(-1)?.at(0).startsWith("GraphSettings:") ?
      JSON.parse(data.pop()?.at(0)?.replace("GraphSettings:","")) :
      null;
    let addRegions: Region[] = [];
    let addFeatures: Feature[] = [];
    let updateGenegraphic: {} | null = graphSettings ?
      {
        width: parseInt(graphSettings["graphwidth"]),
        featureHeight: parseInt(graphSettings["featureheight"]),
        showScale: this.parseBool(graphSettings["scaleOn"]),
        multilane: this.parseBool(graphSettings["multilane"]),
        gaps: this.parseBool(graphSettings["keepgaps"]),
        overlap: !this.parseBool(graphSettings["shiftgenes"])
      } : null;
    let shape = "arrow";
    if (graphSettings && graphSettings["arrows"] == "false"){
      shape = "tag";
    }
    let currRegionId = regionId_offset + 1;

    data.forEach((item: any[], index: number)=>{
      if ( index > 0 && item[header.indexOf("genome")] !== data[index-1][header.indexOf("genome")]){
        currRegionId++;
      }
      let feat_start = item[header.indexOf("start")];
      let feat_stop = item[header.indexOf("stop")];
      let feat_first_bp = Math.min(feat_start, feat_stop);
      let feat_last_bp = Math.max(feat_start, feat_stop);
      let lane = 1;

      let colors: string[] = [item[header.indexOf("color")]]

      let thisRegion = addRegions.find(r=> r.id === currRegionId);
      if (!thisRegion){
        addRegions.push({
          id: currRegionId,
          geneGraphicId: geneGraphicId,
          name: item[header.indexOf("genome")],
          nameProps: this.parseRegionProps(item, header),
          position: addRegions.length + 1 + regionPos_offset,
          lanes: 1,
          size: feat_last_bp - feat_first_bp,
          offset: feat_first_bp,
          data: {
            "Genome": this.getIndexOrBlank(header, "genome", item),
          }
        });
      } else {
        if (thisRegion.size > (feat_first_bp-thisRegion.offset) && addFeatures.at(-1)?.lane != 2){
          lane = 2;
          thisRegion.lanes = 2;
        }
        thisRegion.size = (feat_last_bp - thisRegion.offset);
      }

      addFeatures.push({
        regionId: currRegionId,
        name: item[header.indexOf("name")],
        nameProps: this.parseFeatureProps(item, header),
        start: feat_start,
        stop: feat_stop,
        length: item[header.indexOf("size")],
        shape: shape,
        colors: colors,
        lane: lane,
        data: {
          "Feature Name": this.getIndexOrBlank(header, "name", item),
          "Function": this.getIndexOrBlank(header, "function", item),
        }
      })
    })

    return [addRegions, addFeatures, updateGenegraphic];
  }


  async parseAndStore(fileContent: string, newSession: boolean){
    const geneGraphicId = await this.getOrCreateGeneGraphic(newSession);
    const [regionId_offset, regionPos_offset] = await this.getRegionOffsets(geneGraphicId);
    let result = this.papa.parse(fileContent, {header: false, dynamicTyping: true, skipEmptyLines: true});
    const header = result.data.shift();

    let addRegions: Region[];
    let addFeatures: Feature[];
    let updateGenegraphic: {} | null = null;
    if (this.headersEqual(header, GizmogeneHeader)){
      [addRegions, addFeatures] = this.parseGizmogene(geneGraphicId, result.data, header, regionId_offset, regionPos_offset);
    } else if ( this.headersEqual(header, SeedHeader)){
      [addRegions, addFeatures] = this.parseSeed(geneGraphicId, result.data, header, regionId_offset, regionPos_offset);
    } else if (this.headersEqual(header, LegacyHeader)){
      [addRegions, addFeatures, updateGenegraphic] = this.parseLegacy(geneGraphicId, result.data, header, regionId_offset, regionPos_offset);
    } else {
      throw new Error("Unrecognized file format.")
    }
    this.db.transaction("rw", this.db.geneGraphics, this.db.regions, this.db.features, ()=>{
      if (updateGenegraphic){
        this.db.geneGraphics.update(geneGraphicId, updateGenegraphic);
      }
      this.db.regions.bulkAdd(addRegions);
      this.db.features.bulkAdd(addFeatures);
    })

  }
}
