import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core'
import { FormBuilder } from '@angular/forms'
import { DatabaseService } from '../database.service'
import { Feature, GeneGraphic } from '../models'
import {
    deleteFeatures,
  getDefaultProperty,
  updateFeatureColors,
  updateFeatureShapes,
} from '../utils'

@Component({
  selector: 'app-editor-features',
  templateUrl: './editor-features.component.html',
  styleUrls: ['./editor-features.component.scss'],
})
export class EditorFeaturesComponent implements OnChanges, OnInit {
  @Input() features!: Feature[]
  @Input() geneGraphic!: GeneGraphic
  featuresForm = this.fb.group({
    shape: [''],
    color: this.fb.group({
      split: [false],
      color1: ['' as string],
      color2: [null as string | null],
    }),
  })

  shapeOptions = ['Arrow', 'Tag', 'Narrow Tag', 'Bar', 'Narrow Bar']

  constructor(private fb: FormBuilder, private db: DatabaseService) {}

  deleteFeatures(){
    let confirmed = confirm("Are you sure you want to delete the selected feature(s)?")
    if(confirmed) deleteFeatures(this.db, this.geneGraphic, this.features.map(f=>f.id));
  }

  ngOnInit(): void {
    this.featuresForm.get('shape')?.valueChanges.subscribe((val) => {
      updateFeatureShapes(
        this.db,
        this.geneGraphic,
        this.features.map((f) => f.id),
        val as string
      )
    })
    this.featuresForm.get('color.split')?.valueChanges.subscribe((val) => {
      const color2 = this.featuresForm.get('color.color1')?.value;
      if(val && color2) this.featuresForm.get('color.color2')?.setValue(color2);
      if(!val || !color2) this.featuresForm.get('color.color2')?.setValue(null);
    })
    this.featuresForm.get('color.color1')?.valueChanges.subscribe((val) => {
        const color1 = val || '#FFFFFF'
        const color2 = this.featuresForm.get('color.color2')?.value || null
        updateFeatureColors(
          this.db,
          this.geneGraphic,
          this.features.map((f) => f.id),
          color1,
          color2
        )
    })
    this.featuresForm.get('color.color2')?.valueChanges.subscribe((val) => {
        const color1 = this.featuresForm.get('color.color1')?.value || '#FFFFFF'
        const color2 = val
        updateFeatureColors(
          this.db,
          this.geneGraphic,
          this.features.map((f) => f.id),
          color1,
          color2
        )
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['features']) {
      this.featuresForm
        .get('shape')
        ?.setValue(
          (getDefaultProperty(this.features, 'shape') as string) || 'arrow',
          { emitEvent: false }
        )
      let color1 =
        (getDefaultProperty(this.features, 'color1') as string) || '#FFFFFF'
      let color2 = getDefaultProperty(this.features, 'color2') as string | null
      let split = color2 === null ? false : true
      this.featuresForm
        .get('color.color1')
        ?.setValue(color1, { emitEvent: false })
      this.featuresForm
        .get('color.color2')
        ?.setValue(color2, { emitEvent: false })
      this.featuresForm
        .get('color.split')
        ?.setValue(split, { emitEvent: false })
    }
  }
}
