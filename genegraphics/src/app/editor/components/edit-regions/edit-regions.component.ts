import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DatabaseService } from '@services/database.service';
import { GeneGraphic, Region, Selection } from '@models/models';
import { SelectionService } from '@services/selection.service';
import {
  getDefaultProperty,
  changeRegionPosition,
  flipRegionsAndUpdate,
  updateRegionLines,
  deleteRegions,
} from '@helpers/utils';

@Component({
  selector: 'edit-regions',
  templateUrl: './edit-regions.component.html',
  styleUrls: ['./edit-regions.component.scss'],
})
export class EditRegionsComponent implements OnInit, OnChanges {
  @Input() regions!: Region[];
  @Input() geneGraphic!: GeneGraphic;
  regionsForm = this.fb.group({
    lines: this.fb.group({
      show: [false],
      both: [false],
    }),
    flipped: [false],
  });
  upDisabled!: boolean;
  downDisabled!: boolean;

  constructor(
    private fb: FormBuilder,
    private db: DatabaseService,
    private sel: SelectionService
  ) {}

  moveRegion(dir: string) {
    changeRegionPosition(this.db, this.regions[0], this.geneGraphic, dir);
  }

  deleteRegions() {
    let confirmed = confirm(
      'Are you sure you want to delete the selected region(s)?'
    );
    if (confirmed) {
      this.sel.deselectAll();
      deleteRegions(
        this.db,
        this.geneGraphic,
        this.regions.map((r) => r.id)
      );
    }
  }

  selectAllFeatures() {
    let newSelection: Selection = {
      type: 'feature',
      ids_list: this.regions.flatMap((r) => r.features.flatMap((f) => f.id)),
    };
    this.sel.selectGroup(newSelection);
  }

  getEditRegionsTitle() {
    let text = 'Editing ';
    if (this.regions.length === 1) return text + '1 Region';
    if (this.regions.length === this.geneGraphic.regions.length)
      return text + ' All Regions';
    else return text + `${this.regions.length} Regions`;
  }

  ngOnInit(): void {
    this.regionsForm.get('flipped')?.valueChanges.subscribe((val) => {
      if (val !== null)
        flipRegionsAndUpdate(
          this.db,
          this.geneGraphic,
          this.regions.map((r) => r.id),
          val
        );
    });
    this.regionsForm.get('lines')?.valueChanges.subscribe((val) => {
      let lines;
      if (val.show && val.both) lines = 2;
      else if (val.show) lines = 1;
      else lines = 0;
      updateRegionLines(
        this.db,
        this.geneGraphic,
        this.regions.map((r) => r.id),
        lines
      );
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['regions']) {
      this.regionsForm
        .get('flipped')
        ?.setValue(
          (getDefaultProperty(this.regions, 'flipped') as boolean) || false,
          { emitEvent: false }
        );
      const lines = (getDefaultProperty(this.regions, 'lines') as number) || 0;
      this.regionsForm
        .get('lines.show')
        ?.setValue(lines > 0 ? true : false, { emitEvent: false });
      this.regionsForm
        .get('lines.both')
        ?.setValue(this.geneGraphic.multilane && lines === 2 ? true : false, {
          emitEvent: false,
        });
      this.upDisabled = this.regions[0].position === 1;
      this.downDisabled =
        this.regions[0].position === this.geneGraphic.regions.length;
    }
  }
}
