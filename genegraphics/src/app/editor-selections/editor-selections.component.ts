import { Component, Input } from '@angular/core';
import { GeneGraphic } from '../models';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-editor-selections',
  templateUrl: './editor-selections.component.html',
  styleUrls: ['./editor-selections.component.scss']
})
export class EditorSelectionsComponent {
  @Input() geneGraphic!: GeneGraphic;
  selectGroup = new FormControl();
    
  constructor(
  ){}

} 
