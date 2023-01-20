import { Component, Input } from '@angular/core';
import { GeneGraphic } from '../database.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})

export class EditorComponent {
  @Input() geneGraphic!: GeneGraphic;
  openTab = "GeneGraphic";

  constructor(){}

  onChangeTab(tab: string){
    this.openTab = tab;
  }
}
