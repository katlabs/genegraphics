import { Component, Input } from '@angular/core'
import { FormGroup, FormControl } from '@angular/forms'
import { Feature } from '../models'

@Component({
  selector: 'app-editor-features',
  templateUrl: './editor-features.component.html',
  styleUrls: ['./editor-features.component.scss'],
})
export class EditorFeaturesComponent {
  @Input() features!: Feature[]
  featuresForm = new FormGroup({
    nameCtrl: new FormControl(),
    namesFromCtrl: new FormControl(),
  })

  constructor() {}

  getFeatureNamesFields() {
    return [
      'BRC ID',
      'Locus Tag',
      'Gene Name',
      'Gene ID',
      'Protein ID',
      'UniprotKB/Swiss-Prot',
      'Product',
      'PATRIC Local Family',
      'PATRIC Global Family',
    ]
  }
}
