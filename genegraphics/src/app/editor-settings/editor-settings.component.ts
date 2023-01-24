import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DatabaseService, GeneGraphic } from '../database.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { EditorService } from '../editor.service';

@Component({
  selector: 'app-editor-settings',
  templateUrl: './editor-settings.component.html',
  styleUrls: ['./editor-settings.component.scss']
})
export class EditorSettingsComponent implements OnInit {
  @Input() geneGraphic!: GeneGraphic;
  globalForm!: FormGroup;

  constructor(
    private db: DatabaseService,
    private editorService: EditorService){}

  displaySelectedSettings(): boolean{
    if (this.editorService.selectedFeatures.length>0){
      return true;
    } else {
      return false;
    }
  }

  ngOnInit(): void {
    this.globalForm = new FormGroup({
      width: new FormControl(this.geneGraphic.width, [Validators.required, Validators.min(100), Validators.max(3000)]),
      featureHeight: new FormControl(this.geneGraphic.featureHeight, [Validators.required, Validators.min(5), Validators.max(100)]),
      multilane: new FormControl(this.geneGraphic.multilane, [Validators.required]),
      gaps: new FormControl(this.geneGraphic.gaps, [Validators.required]),
      overlap: new FormControl(this.geneGraphic.overlap, [Validators.required]),
      showScale: new FormControl(this.geneGraphic.showScale, [Validators.required]),
    })

    for (const field in this.globalForm.controls) {
      const control = this.globalForm.get(field);
      control?.valueChanges.subscribe(selectedValue=>{
        if(control.status == "VALID" && this.geneGraphic.id){
          let update: Record<string, string> = {};
          update[field]=selectedValue;
          this.db.geneGraphics.update(this.geneGraphic.id, update);
        }
      })
    }
  }

}
