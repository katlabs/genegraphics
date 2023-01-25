import { Injectable } from '@angular/core';
import { DatabaseService, Region, Feature } from './database.service';
import { Papa } from 'ngx-papaparse';
import { getUnknownFieldNames, Fields } from './utils/tsv-fields';
import { isGizmogeneData, GizmogeneFields } from './utils/tsv-gizmogene'
import { isSeedData, SeedFields } from './utils/tsv-seed';
import { isLegacyData, LegacyFields } from './utils/tsv-legacy';

@Injectable({
  providedIn: 'root'
})
export class TsvParseService {

  constructor(
    private db: DatabaseService,
    private papa: Papa
  ) { }

  private async parseTsvData(geneGraphicId: number, data: any[], fields: string[]): Promise<any[]> {
    let existingRegions = await this.db.regions.where({geneGraphicId: geneGraphicId}).toArray();
    let regionPos = 1;
    if (existingRegions){
      regionPos = existingRegions.length + 1;
    }
    let fieldNames!: Fields;
    if (isGizmogeneData(data)){
      fieldNames = GizmogeneFields;
    } else if (isSeedData(data)) {
      fieldNames = SeedFields;
    } else if (isLegacyData(data)){
      fieldNames = LegacyFields;
    } else {
      fieldNames = getUnknownFieldNames(fields);
    }
    let addRegions: Region[] = [];
    let addFeatures: Feature[] = [];
    let currRegionId!: number;
    await this.db.regions.orderBy('id').last().then(val => {
      if (val?.id){
        currRegionId = val.id +1;
      } else {
        currRegionId = 1;
      }
    });
    let first_bp = Math.min(data[0][fieldNames.start],data[0][fieldNames.stop]);
    let last_bp = Math.min(data[0][fieldNames.start],data[0][fieldNames.stop]);
    let region_lanes = 1;
    data.forEach((item: any, index: number)=>{
      if(index === 0){
        addRegions.push({
          id: currRegionId,
          name: item[fieldNames.regionName],
          nameProps: this.db.makeNewTextProps(),
          geneGraphicId: geneGraphicId,
          position: regionPos,
          lanes: 1,
          size: 0,
          offset: 0,
        })
      } else if (data[index][fieldNames.regionChange] !== data[index-1][fieldNames.regionChange]){
        let lastInd = addRegions.findIndex(x => x.id == currRegionId);
        addRegions[lastInd].size = last_bp-first_bp;
        addRegions[lastInd].offset = first_bp;
        addRegions[lastInd].lanes = region_lanes;
        region_lanes = 1;
        currRegionId++;
        regionPos++;
        first_bp = item[fieldNames.start];
        last_bp = item[fieldNames.stop];
        addRegions.push({
          id: currRegionId,
          name: item[fieldNames.regionName],
          nameProps: this.db.makeNewTextProps(),
          geneGraphicId: geneGraphicId,
          position: regionPos,
          lanes: region_lanes,
          size: 0,
          offset: 0
        })
      }
      let feat_lane = 1;
      let feat_first_bp = Math.min(item[fieldNames.start],item[fieldNames.stop]);
      if (index > 0 && addFeatures.at(-1)?.regionId == currRegionId && feat_first_bp < last_bp && addFeatures.at(-1)?.lane!=2){
        feat_lane = 2;
        region_lanes = 2;
      }
      first_bp = Math.min(first_bp, feat_first_bp);
      last_bp = Math.max(last_bp, item[fieldNames.start], item[fieldNames.stop]);
      addFeatures.push({
        name: item[fieldNames.featureName],
        nameProps: this.db.makeNewTextProps(),
        start: item[fieldNames.start],
        stop: item[fieldNames.stop],
        length: item[fieldNames.length],
        shape: "arrow",
        regionId: currRegionId,
        lane: feat_lane
      })
    });
    let lastInd = addRegions.findIndex(x => x.id == currRegionId);
    addRegions[lastInd].size = last_bp-first_bp;
    addRegions[lastInd].offset = first_bp;
    addRegions[lastInd].lanes = region_lanes;


    return [addRegions, addFeatures];
  }

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

  async parseAndStore(fileContent: string, newSession: boolean){
    let geneGraphicId = await this.getOrCreateGeneGraphic(newSession);
    let result = this.papa.parse(fileContent, {header: true, skipEmptyLines: true});
    let [addRegions, addFeatures] = await this.parseTsvData(geneGraphicId, result.data, result.meta.fields);

    this.db.transaction("rw", this.db.regions, this.db.features, ()=>{
      this.db.regions.bulkAdd(addRegions);
      this.db.features.bulkAdd(addFeatures);
    })

  }
}
