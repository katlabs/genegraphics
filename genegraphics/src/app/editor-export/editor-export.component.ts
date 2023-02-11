import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EditorService } from '../editor.service';
import { ExportService } from '../export.service';
import { SelectionService } from '../selection.service';

@Component({
  selector: 'app-editor-export',
  templateUrl: './editor-export.component.html',
  styleUrls: ['./editor-export.component.scss']
})
export class EditorExportComponent implements OnInit{
  exportOptions = ['SVG', 'PNG', 'TIFF', 'GeneGraphics JSON']
  exportCtrl = new FormControl(0);
  pngBGCtrl = new FormControl('None');

  constructor(
    private exportService: ExportService,
    private editorService: EditorService,
    private sel: SelectionService,
  ){}

  onClickExport(){
    switch (this.exportCtrl.value){
      case 0:
        this.exportService.saveSVG();
      break
      case 1:
        this.exportService.savePNG();
      break
      case 2:
        this.exportService.saveTIFF();
      break
      case 3:
        this.exportService.saveJSON();
      break
    }
  }

  ngOnInit(): void {
    this.editorService.tabIndex$.subscribe(tab=>{
      if(tab===2) this.sel.deselectAll();
    })
  }

}
