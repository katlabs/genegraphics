import { Injectable } from '@angular/core';
import { DatabaseService, GeneGraphic, Region, Feature } from './database.service';
import { Papa } from 'ngx-papaparse';

@Injectable({
  providedIn: 'root'
})
export class TsvParseService {

  constructor(
    private db: DatabaseService,
    private papa: Papa
  ) { }

  private regionNameFields = ["Genome",  "genome", "Genome ID"];
  private featureNameFields = ["Function", "ID", "Feature ID", "PATRIC Local Family", "PATRIC Global Family"];
  private startFields = ["Start", "start"];
  private stopFields = ["Stop", "End", "stop", "end"];
  private lengthFields = ["Length (nt)", "Size (nt)", "size"];

  private getFieldName(fields: string[], validFields: string[]): string{
    let fieldName = validFields.find( f => {
      return fields.includes(f);
    })
    return fieldName ? fieldName : "";
  }

  async parseAndStore(fileContent: string, newSession: boolean){
    let geneGraphicId: number;
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

    let result = this.papa.parse(fileContent, {header: true});
    let data = result.data;
    let fields = result.meta.fields;
    let regionNameField = this.getFieldName(fields, this.regionNameFields);
    let featureNameField = this.getFieldName(fields, this.featureNameFields);
    let startField = this.getFieldName(fields, this.startFields);
    let stopField = this.getFieldName(fields, this.stopFields);
    let lengthField = this.getFieldName(fields, this.lengthFields);
    let regionChangeField = fields.includes("Region number")? "Region number" : regionNameField;

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
          name: item[regionNameField],
          geneGraphicId: geneGraphicId
        })
      } else if (data[index][regionChangeField] !== data[index-1][regionChangeField]){
        currRegionId++;
        addRegions.push({
          id: currRegionId,
          name: item[regionNameField],
          geneGraphicId: geneGraphicId
        })
      }
      addFeatures.push({
        name: item[featureNameField],
        start: item[startField],
        stop: item[stopField],
        length: item[lengthField],
        regionId: currRegionId
      })

    });
    console.log(addRegions);
    console.log(addFeatures);

    this.db.transaction("rw", this.db.regions, this.db.features, ()=>{
      this.db.regions.bulkAdd(addRegions);
      this.db.features.bulkAdd(addFeatures);
    })
  }
}
