import { Component, Input, OnInit } from '@angular/core';
import { DatabaseService, GeneGraphic } from '../database.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EditorService } from '../editor.service';

@Component({
  selector: 'app-editor-settings',
  templateUrl: './editor-settings.component.html',
  styleUrls: ['./editor-settings.component.scss']
})
export class EditorSettingsComponent implements OnInit {
  @Input() geneGraphic!: GeneGraphic;
  imageSettingsForm!: FormGroup;

  constructor(
    private db: DatabaseService,
    private editorService: EditorService){}

  ngOnInit(): void {
    if(this.geneGraphic.id){
      this.imageSettingsForm = new FormGroup({
        width: new FormControl(this.geneGraphic.width,{
          validators: [Validators.required, Validators.min(100), Validators.max(3000)],
          updateOn: "blur"}),
        featureHeight: new FormControl(this.geneGraphic.featureHeight,{
          validators: [Validators.required, Validators.min(5), Validators.max(100)],
          updateOn: "blur"}),
        showTitle: new FormControl(this.geneGraphic.titleProps.show),
        showScale: new FormControl(this.geneGraphic.showScale),
        multilane: new FormControl(this.geneGraphic.multilane),
        overlap: new FormControl(this.geneGraphic.overlap),
        gaps: new FormControl(this.geneGraphic.gaps),
      })

      for (const field in this.imageSettingsForm.controls){
        const control = this.imageSettingsForm.get(field);
        control?.valueChanges.subscribe(selectedValue=>{
          if(control.status == "VALID" && this.geneGraphic.id){
            if(field=="showTitle"){
              this.db.geneGraphics.update(this.geneGraphic.id,{
                titleProps: { show : selectedValue }});
            } else {
              let update: Record<string,string> = {};
              update[field] = selectedValue;
              this.db.geneGraphics.update(this.geneGraphic.id, update);
            }
          }
        })
      }
    }
  }

}
