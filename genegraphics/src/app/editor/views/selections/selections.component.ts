import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { GeneGraphic, Selection } from '@models/models';
import { FormControl } from '@angular/forms';
import { SelectionService } from '@services/selection.service';
import {
  selectionsEqual,
  deleteSelection,
  saveSelection,
} from '@helpers/utils';
import { DatabaseService } from '@services/database.service';

@Component({
  selector: 'editor-selections',
  templateUrl: './selections.component.html',
  styleUrls: ['./selections.component.scss'],
})
export class SelectionsComponent implements OnChanges, OnInit {
  @Input() geneGraphic!: GeneGraphic;
  selectCtrl = new FormControl();
  saveCtrl = new FormControl('New Selection');
  savedSelections: Selection[] = [];
  featureHomologs: string[] = [];

  constructor(private sel: SelectionService, private db: DatabaseService) {}

  saveNewSelection() {
    if (this.geneGraphic.id) {
      let newSelection = this.selectCtrl.value;
      newSelection.name = this.saveCtrl.value || 'New Selection';
      saveSelection(this.db, this.geneGraphic, newSelection);
    }
    this.saveCtrl.setValue('New Selection');
  }

  deleteSavedSelection() {
    if (this.geneGraphic.id) {
      deleteSelection(this.db, this.geneGraphic, this.selectCtrl.value);
      this.selectCtrl.setValue(null);
    }
  }

  isSavedSelection(selection: Selection) {
    if (!selection) return false;
    return this.savedSelections.find((sel) => selectionsEqual(sel, selection));
  }

  getSelectedRegions(ids_list: string[]) {
    return this.geneGraphic.regions.filter((r) => ids_list.includes(r.id));
  }

  getSelectedFeatures(ids_list: string[]) {
    return this.geneGraphic.regions.flatMap((r) =>
      r.features.filter((f) => ids_list.includes(f.id))
    );
  }

  selectAllRegions() {
    let ids_list = this.geneGraphic.regions.map((r) => r.id);
    let selection: Selection = {
      name: 'All Regions',
      type: 'region',
      ids_list: ids_list,
    };
    this.selectCtrl.setValue(selection);
  }

  selectAllFeatures() {
    let ids_list = this.geneGraphic.regions.flatMap((r) => {
      return r.features.flatMap((f) => f.id);
    });
    let selection: Selection = {
      name: 'All Features',
      type: 'feature',
      ids_list: ids_list,
    };
    this.selectCtrl.setValue(selection);
  }

  selectFeaturesFromRegions() {
    const region_ids = this.selectCtrl.value.ids_list;
    let ids_list = this.geneGraphic.regions
      .filter((r) => region_ids.includes(r.id))
      .flatMap((r) => {
        return r.features.flatMap((f) => f.id);
      });
    let selection: Selection = {
      type: 'feature',
      ids_list: ids_list,
    };
    this.selectCtrl.setValue(selection);
  }

  clearSelection() {
    this.selectCtrl.setValue({
      type: 'empty',
      ids_list: [],
    });
  }

  selectAllHomologs() {
    this.selectCtrl.setValue({
      type: 'feature',
      ids_list: this.featureHomologs,
    });
  }

  updateHomologs() {
    const selected_ids = this.selectCtrl.value.ids_list;
    const selection_type = this.selectCtrl.value.type;
    if (selection_type !== 'feature' || selected_ids.length < 1) {
      this.featureHomologs = [];
    } else {
      const selectedFeatures = this.getSelectedFeatures(selected_ids);
      if (
        selected_ids.length > 1 &&
        !selectedFeatures.every(
          (f) => f.Product === selectedFeatures[0].Product
        )
      ) {
        this.featureHomologs = [];
      } else {
        this.featureHomologs = this.geneGraphic.regions
          .flatMap((r) =>
            r.features.filter((f) => f.Product === selectedFeatures[0].Product)
          )
          .map((f) => f.id);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['geneGraphic']) {
      this.savedSelections = this.geneGraphic.selections;
    }
  }

  ngOnInit(): void {
    this.selectCtrl.setValue(
      { type: 'empty', ids_list: [] },
      { emitEvent: false }
    );
    this.sel.selection$.subscribe((selection) => {
      const matching_sel = this.isSavedSelection(selection);
      if (matching_sel)
        this.selectCtrl.setValue(matching_sel, { emitEvent: false });
      else this.selectCtrl.setValue(selection, { emitEvent: false });
      this.updateHomologs();
    });
    this.selectCtrl.valueChanges.subscribe((selectedValue: Selection) => {
      if (selectedValue) {
        this.sel.selectGroup(selectedValue);
      }
    });
  }
}
