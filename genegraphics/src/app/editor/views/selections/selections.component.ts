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

  private emptySelection: Selection = {
    name: 'None',
    type: 'empty',
    ids_list: [],
  };
  private allRegionsSelection: Selection = {
    name: 'All regions',
    type: 'region',
    ids_list: [],
  };
  private allFeaturesSelection: Selection = {
    name: 'All features',
    type: 'feature',
    ids_list: [],
  };
  selectionOptions = [
    {
      name: 'Default Selections',
      options: [
        this.emptySelection,
        this.allRegionsSelection,
        this.allFeaturesSelection,
      ],
    },
    { name: 'Your Selections', options: [] as Selection[] },
  ];
  selectCtrl = new FormControl();
  saveCtrl = new FormControl('New Selection');

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
      this.selectCtrl.setValue(this.emptySelection);
    }
  }

  isInOptions(selection: Selection) {
    // Returns selection that matches a selection in defaults or saved selections or undefined
    return this.selectionOptions
      .flatMap((o) => o.options)
      .find((sel) => selectionsEqual(sel, selection));
  }

  isSavedSelection(selection: Selection) {
    // Returns the selection that matches a saved selection or undefined
    return this.selectionOptions[1].options.find((sel) =>
      selectionsEqual(sel, selection)
    );
  }

  getSelectedRegions(ids_list: string[]) {
    return this.geneGraphic.regions.filter((r) => ids_list.includes(r.id));
  }

  getSelectedFeatures(ids_list: string[]) {
    return this.geneGraphic.regions.flatMap((r) =>
      r.features.filter((f) => ids_list.includes(f.id))
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['geneGraphic']) {
      this.selectionOptions[1].options = this.geneGraphic.selections;
      this.allRegionsSelection.ids_list = this.geneGraphic.regions.map(
        (r) => r.id
      );
      this.allFeaturesSelection.ids_list = this.geneGraphic.regions.flatMap(
        (r) => r.features.flatMap((f) => f.id)
      );
    }
  }

  ngOnInit(): void {
    this.selectCtrl.setValue(this.emptySelection);
    this.sel.selection$.subscribe((selection) => {
      const matching_sel = this.isInOptions(selection);
      if (matching_sel)
        this.selectCtrl.setValue(matching_sel, { emitEvent: false });
      else this.selectCtrl.setValue(selection, { emitEvent: false });
    });
    this.selectCtrl.valueChanges.subscribe((selectedValue: Selection) => {
      if (selectedValue) {
        this.sel.selectGroup(selectedValue);
      }
    });
  }
}
