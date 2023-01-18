import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DatabaseService, GeneGraphic } from '../database.service';
import { liveQuery } from 'dexie';


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})

export class EditorComponent implements OnChanges {
  @Input() geneGraphic!: GeneGraphic;
  geneGraphics$ = liveQuery(()=> this.listGeneGraphics());
  selectCtrl = new FormControl();
  inputCtrl = new FormControl();

  constructor( private db: DatabaseService ){}

  async listGeneGraphics() {
    return await this.db.geneGraphics.toArray();
  }

  async changeActiveGeneGraphic(e: any) {
    let id = parseInt(e.target.value);
    await this.db.geneGraphics.update(id, {
      opened: Date.now()
    })
  }

  async addGeneGraphic() {
    await this.db.geneGraphics.add({
      title: this.inputCtrl.value,
      opened: Date.now()
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['geneGraphic']){
      this.selectCtrl.setValue(changes['geneGraphic'].currentValue.id);
    }
  }

}
