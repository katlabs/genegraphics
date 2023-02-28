import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EditorService } from '@services/editor.service';
import { ExportService } from '@services/export.service';
import { GeneGraphic } from '@models/models';
import { SelectionService } from '@services/selection.service';

@Component({
  selector: 'editor-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss'],
})
export class ExportComponent implements OnInit {
  @Input() geneGraphic!: GeneGraphic;
  exportOptions = [
    'SVG',
    'PNG',
    'TIFF',
    'Current GeneGraphic (JSON)',
    'All GeneGraphics (JSON)',
  ];
  exportCtrl = new FormControl(0);
  pngBGCtrl = new FormControl('None');
  loading: boolean = false;

  constructor(
    private exportService: ExportService,
    private editorService: EditorService,
    private sel: SelectionService
  ) {}

  onClickExport() {
    switch (this.exportCtrl.value) {
      case 0:
        this.exportService.saveSVG();
        break;
      case 1:
        this.exportService.savePNG();
        break;
      case 2:
        this.exportService.saveTIFF();
        break;
      case 3:
        if (this.geneGraphic.id) this.exportService.saveJSON(this.geneGraphic);
        break;
      case 4:
        this.exportService.saveJSON();
        break;
    }
  }

  ngOnInit(): void {
    this.editorService.tabIndex$.subscribe((tab) => {
      if (tab.name === 'export') this.sel.deselectAll();
    });
    this.exportService.processing$.subscribe((val) => {
      this.loading = val;
    });
  }
}
