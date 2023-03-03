import { Component, Input, OnInit } from '@angular/core';
import { Feature, GeneGraphic, Region, Selection } from '@models/models';
import { EditorService } from '@services/editor.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit {
  @Input() geneGraphic!: GeneGraphic;
  tabIndex!: number;
  selection!: Selection;
  regions: Region[] = [];
  features: Feature[] = [];

  constructor(private editorService: EditorService) {}

  changeTabIndex(e: number) {
    this.editorService.openTab(e);
  }

  ngOnInit(): void {
    this.tabIndex = 3;
    this.editorService.tabIndex$.subscribe(
      (tab) => (this.tabIndex = tab.index)
    );
  }
}
