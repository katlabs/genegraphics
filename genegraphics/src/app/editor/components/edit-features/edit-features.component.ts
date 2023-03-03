import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { DatabaseService } from '@services/database.service';
import { Feature, GeneGraphic } from '@models/models';
import {
  deleteFeatures,
  getDefaultProperty,
  updateFeatureColors,
  updateFeatureShapes,
} from '@helpers/utils';

@Component({
  selector: 'edit-features',
  templateUrl: './edit-features.component.html',
  styleUrls: ['./edit-features.component.scss'],
})
export class EditFeaturesComponent implements OnChanges, OnInit {
  @Input() features!: Feature[];
  @Input() geneGraphic!: GeneGraphic;
  shape = new FormControl('');

  shapeOptions = ['Arrow', 'Tag', 'Narrow Tag', 'Bar', 'Narrow Bar'];

  constructor(private fb: FormBuilder, private db: DatabaseService) {}

  deleteFeatures() {
    let confirmed = confirm(
      'Are you sure you want to delete the selected feature(s)?'
    );
    if (confirmed)
      deleteFeatures(
        this.db,
        this.geneGraphic,
        this.features.map((f) => f.id)
      );
  }

  getEditFeaturesTitle() {
    let text = 'Editing ';
    if (this.features.length === 1) return text + '1 Feature';
    if (
      this.features.length ===
      this.geneGraphic.regions.reduce(
        (res, { features }) => res + features.length,
        0
      )
    )
      return text + ' All Features';
    else return text + `${this.features.length} Features`;
  }

  ngOnInit(): void {
    this.shape.valueChanges.subscribe((val) => {
      updateFeatureShapes(
        this.db,
        this.geneGraphic,
        this.features.map((f) => f.id),
        val as string
      );
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['features']) {
      this.shape.setValue(
        (getDefaultProperty(this.features, 'shape') as string) || 'arrow',
        { emitEvent: false }
      );
    }
  }
}
