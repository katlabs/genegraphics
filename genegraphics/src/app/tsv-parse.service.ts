import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
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

    data.forEach(async (item: any, index: number)=>{
      var currGenomeId!: number;
      if(index === 0){
        currGenomeId = await this.db.regions.add({
          name: item[this.getFieldName(fields, this.regionNameFields)],
          geneGraphicId: geneGraphicId
        });
      } else if (data[index][regionChangeField] !== data[index-1][regionChangeField]){
        currGenomeId = await this.db.regions.add({
          name: item[regionNameField],
          geneGraphicId: geneGraphicId
        })
      } else {
        await this.db.regions.orderBy('id').last().then((x) => {
            currGenomeId = x?.id !==undefined ? x?.id : currGenomeId;
        })
      }
      await this.db.features.add({
        name: item[featureNameField],
        start: item[startField],
        stop: item[stopField],
        length: item[lengthField],
        regionId: currGenomeId
      })
    });
  }
}
