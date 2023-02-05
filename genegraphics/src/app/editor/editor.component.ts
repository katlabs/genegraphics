import { Component, Input, OnInit } from '@angular/core';
import { GeneGraphic } from '../models';
import { EditorService } from '../editor.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})

export class EditorComponent implements OnInit {
  @Input() geneGraphic!: GeneGraphic;
  tabIndex!: number;

  constructor(private editorService: EditorService){}

  ngOnInit(): void {
    this.editorService.tabIndex$.subscribe(tab=>this.tabIndex = tab);
  }
}
