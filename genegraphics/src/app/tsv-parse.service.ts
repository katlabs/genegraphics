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

  private async parseTsvData(geneGraphicId: number, data: any[], fields: string[]) {

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
    data.forEach((item: any, index: number)=>{
      if(index === 0){
        addRegions.push({
          id: currRegionId,
          name: item[fieldNames.regionName],
          geneGraphicId: geneGraphicId
        })
      } else if (data[index][fieldNames.regionChange] !== data[index-1][fieldNames.regionChange]){
        currRegionId++;
        addRegions.push({
          id: currRegionId,
          name: item[fieldNames.regionName],
          geneGraphicId: geneGraphicId
        })
      }
      addFeatures.push({
        name: item[fieldNames.featureName],
        start: item[fieldNames.start],
        stop: item[fieldNames.stop],
        length: item[fieldNames.length],
        regionId: currRegionId
      })

    });

    return [addRegions, addFeatures];
  }

  private async getOrCreateGeneGraphic(newSession: boolean){
    let geneGraphicId!: number;
    if (newSession){
       geneGraphicId = await this.db.geneGraphics.add({
        title: "New GeneGraphic",
        opened: Date.now()
      });
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
