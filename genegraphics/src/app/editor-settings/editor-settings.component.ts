import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DatabaseService, GeneGraphic } from '../database.service';

@Component({
  selector: 'app-editor-settings',
  templateUrl: './editor-settings.component.html',
  styleUrls: ['./editor-settings.component.scss']
})
export class EditorSettingsComponent {
  @Input() geneGraphic!: GeneGraphic;
  inputCtrl = new FormControl()

  constructor( private db: DatabaseService ){}

  async changeGeneGraphicName(e: any) {
    if(this.geneGraphic.id){
      await this.db.geneGraphics.update(this.geneGraphic.id, {
        title: e.target.value
      });
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['geneGraphic']){
      this.inputCtrl.setValue(changes['geneGraphic'].currentValue.title);
    }
  }

}
