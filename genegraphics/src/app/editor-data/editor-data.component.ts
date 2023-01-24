import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DatabaseService, GeneGraphic } from '../database.service';
import { liveQuery } from 'dexie';

@Component({
  selector: 'app-editor-data',
  templateUrl: './editor-data.component.html',
  styleUrls: ['./editor-data.component.scss']
})
export class EditorDataComponent implements OnChanges {
  @Input() geneGraphic!: GeneGraphic;
  geneGraphics$ = liveQuery(()=> this.listGeneGraphics())
  selectCtrl = new FormControl();

  constructor( private db: DatabaseService ){}

  async listGeneGraphics() {
    return await this.db.geneGraphics.toArray();
  }

  async changeActiveGeneGraphic(e: any) {
    if(e.target.value == 0){
      this.addGeneGraphic();
    } else {
      let id = parseInt(e.target.value);
      await this.db.geneGraphics.update(id, {
        opened: Date.now()
      })
    }
  }

  async addGeneGraphic() {
    await this.db.addNewGeneGraphic();
  }

  async deleteGeneGraphic() {
    await this.db.transaction('rw', this.db.geneGraphics, this.db.regions, this.db.features, async ()=>{
      let regionIds = await this.db.regions.where({geneGraphicId: this.geneGraphic.id}).primaryKeys();
      let featureIds = await this.db.features.where('regionId').anyOf(regionIds).primaryKeys();
      let geneGraphics = await this.db.geneGraphics.toArray();
      if(geneGraphics.length > 1){
        await this.db.geneGraphics.where({id: this.geneGraphic.id}).delete();
      } else if(geneGraphics[0].id) {
        this.db.geneGraphics.update(geneGraphics[0].id, {title: "New GeneGraphic"});
      }
      await this.db.regions.bulkDelete(regionIds);
      await this.db.features.bulkDelete(featureIds);
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['geneGraphic']){
      this.selectCtrl.setValue(changes['geneGraphic'].currentValue.id);
    }
  }
}
