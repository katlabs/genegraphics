import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DatabaseService, GeneGraphic } from '../database.service';
import { liveQuery } from 'dexie';

@Component({
  selector: 'app-editor-gene-graphic',
  templateUrl: './editor-gene-graphic.component.html',
  styleUrls: ['./editor-gene-graphic.component.scss']
})
export class EditorGeneGraphicComponent implements OnChanges {
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
    await this.db.geneGraphics.add({
      title: 'New GeneGraphic',
      opened: Date.now(),
      width: this.geneGraphic.width,
      featureHeight: this.geneGraphic.featureHeight,
      showScale: this.geneGraphic.showScale
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['geneGraphic']){
      this.selectCtrl.setValue(changes['geneGraphic'].currentValue.id);
    }
  }
}
