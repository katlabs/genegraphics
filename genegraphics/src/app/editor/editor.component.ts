import { Component, Input } from '@angular/core';
import { GeneGraphic } from '../database.service';
import { EditorService } from '../editor.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})

export class EditorComponent {
  @Input() geneGraphic!: GeneGraphic;

  constructor(private editorService: EditorService){}

  getOpenTab(){
    return this.editorService.openTab;
  }

  onChangeTab(tab: string){
    this.editorService.openTab = tab;
  }
}
