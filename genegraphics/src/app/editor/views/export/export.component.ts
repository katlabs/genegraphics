import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EditorService } from '@services/editor.service';
import { ExportService } from '@services/export.service';
import { GeneGraphic } from '@models/models';
import { SelectionService } from '@services/selection.service';
import { MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { tooltipDefaults } from '@app/shared/helpers/utils';

@Component({
  selector: 'editor-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss'],
  providers: [
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: tooltipDefaults },
  ],
})
export class ExportComponent implements OnInit {
  @Input() geneGraphic!: GeneGraphic;
  exportOptions = [
    'SVG',
    'SVG (embed fonts)',
    'PNG',
    'TIFF',
    'Current GeneGraphic (JSON)',
    'All GeneGraphics (JSON)',
  ];
  exportCtrl = new FormControl(0);
  loading: boolean = false;
  error: string | null = null;

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
        this.exportService.saveSVGEmbedFonts();
        break;
      case 2:
        this.exportService.savePNG();
        break;
      case 3:
        this.exportService.saveTIFF();
        break;
      case 4:
        if (this.geneGraphic.id) this.exportService.saveJSON(this.geneGraphic);
        else {
          this.loading = false;
          this.error = 'No Gene Graphic selected.';
        }
        break;
      case 5:
        this.exportService.saveJSON();
        break;
    }
  }

  ngOnInit(): void {
    this.editorService.tabIndex$.subscribe((tab) => {
      if (tab.name === 'export') this.sel.deselectAll();
    });
    this.exportService.status$.subscribe((val) => {
      this.loading = val.processing;
      this.error = val.error;
    });
  }
}
