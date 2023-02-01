import { Component, Input, OnInit } from '@angular/core';
import { DatabaseService, Feature, GeneGraphic } from '../database.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { EditorService } from '../editor.service';

@Component({
  selector: 'app-editor-features',
  templateUrl: './editor-features.component.html',
  styleUrls: ['./editor-features.component.scss']
})
export class EditorFeaturesComponent implements OnInit {
  @Input() features!: Feature[];
  featuresForm = new FormGroup({
    nameCtrl: new FormControl(),
    namesFromCtrl: new FormControl(),
  })

  constructor(
    private db: DatabaseService,
    private editorService: EditorService,
  ){}


  getFeatureNamesFields(){
    return ["BRC ID","Locus Tag", "Gene Name", "Gene ID", "Protein ID", "UniprotKB/Swiss-Prot", "Product", "PATRIC Local Family", "PATRIC Global Family"]
  }

  ngOnInit(): void {

  }
}
