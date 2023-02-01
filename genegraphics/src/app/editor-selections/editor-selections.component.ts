import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { GeneGraphic, SelectionGroup } from '../database.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { EditorService } from '../editor.service';

@Component({
  selector: 'app-editor-selections',
  templateUrl: './editor-selections.component.html',
  styleUrls: ['./editor-selections.component.scss']
})
export class EditorSelectionsComponent implements OnInit {
  @Input() geneGraphic!: GeneGraphic;
  selectGroup = new FormControl();
    
  constructor(
    private editorService: EditorService
  ){}

  getDefaultSelectionGroups(){
  }

  ngOnInit(): void {
  
  }
} 
