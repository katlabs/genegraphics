import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormBuilder } from '@angular/forms';
import { DatabaseService } from '@services/database.service';
import { Feature, GeneGraphic } from '@models/models';
import {
  deleteFeatures,
  getDefaultColors,
  getDefaultProperty,
  updateFeatureColors,
  updateFeatureShapes,
} from '@helpers/utils';
import { SelectionService } from '@app/shared/services/selection.service';

@Component({
  selector: 'edit-features',
  templateUrl: './edit-features.component.html',
  styleUrls: ['./edit-features.component.scss'],
})
export class EditFeaturesComponent implements OnChanges, OnInit {
  @Input() features!: Feature[];
  @Input() geneGraphic!: GeneGraphic;

  shape = new FormControl('' as string);
  colors = this.fb.array([] as FormControl[]);
  shapeOptions = ['Arrow', 'Tag', 'Narrow Tag', 'Bar', 'Narrow Bar'];

  constructor(
    private fb: FormBuilder,
    private db: DatabaseService,
    private sel: SelectionService
  ) {}

  deleteFeatures() {
    let confirmed = confirm(
      'Are you sure you want to delete the selected feature(s)?'
    );
    if (confirmed) this.sel.deselectAll();
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

  addOrRemoveColor(add: boolean) {
    if (add) {
      this.colors.push(new FormControl('#FFFFFF'));
    } else {
      this.colors.removeAt(this.colors.value.length - 1);
    }
  }

  getNumColors() {
    if (this.colors.value) {
      return this.colors.value.length;
    } else {
      return 0;
    }
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
    this.colors.valueChanges.subscribe((vals) => {
      updateFeatureColors(
        this.db,
        this.geneGraphic,
        this.features.map((f) => f.id),
        vals
      );
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['features']) {
      this.shape.setValue(
        (getDefaultProperty(this.features, 'shape') as string) || 'arrow',
        { emitEvent: false }
      );
      const newColors = getDefaultColors(this.features);
      const currentFormColors = this.colors.value;

      newColors.forEach((color, i) => {
        if (currentFormColors[i]) {
          if (currentFormColors[i] !== color) {
            this.colors.at(i).setValue(color, { emitEvent: false });
          }
        } else {
          this.colors.push(new FormControl(color), { emitEvent: false });
        }
        while (this.colors.value.length > newColors.length) {
          this.colors.removeAt(this.colors.value.length - 1, {
            emitEvent: false,
          });
        }
      });
    }
  }
}
