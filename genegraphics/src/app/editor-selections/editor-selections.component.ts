import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core'
import { GeneGraphic, Selection } from '../models'
import { FormControl } from '@angular/forms'
import { SelectionService } from '../selection.service'
import { 
  selectionsEqual,
  deleteSelection,
  getCurrentSavedSelections,
  saveNewSelection,
} from '../utils'
import { DatabaseService } from '../database.service'

@Component({
  selector: 'app-editor-selections',
  templateUrl: './editor-selections.component.html',
  styleUrls: ['./editor-selections.component.scss'],
})
export class EditorSelectionsComponent implements OnChanges, OnInit {
  @Input() geneGraphic!: GeneGraphic

  private emptySelection: Selection = {
    name: 'None',
    type: 'empty',
    ids_list: [],
  }
  private allRegionsSelection: Selection = {
    name: 'All regions',
    type: 'region',
    ids_list: [],
  }
  private allFeaturesSelection: Selection = {
    name: 'All features',
    type: 'feature',
    ids_list: [],
  }
  private savedSelections: Selection[] = []
  selectionOptions = [
    {
      name: 'Default Selections',
      options: [this.emptySelection, this.allRegionsSelection, this.allFeaturesSelection],
    },
    { name: 'Your Selections', options: this.savedSelections },
  ]
  selectCtrl = new FormControl()
  saveCtrl = new FormControl('New Selection')
  currentSelection!: Selection

  constructor(private sel: SelectionService, private db: DatabaseService) {}

  saveNewSelection() {
    if (this.geneGraphic.id) {
      let newSelection = this.selectCtrl.value
      newSelection.name = this.saveCtrl.value || 'New Selection'
      saveNewSelection(this.db, this.geneGraphic.id, newSelection);
    }
  }

  deleteSavedSelection() {
    if(this.geneGraphic.id){
      deleteSelection(this.db, this.geneGraphic.id, this.selectCtrl.value);
      this.selectCtrl.setValue(this.emptySelection);
    }
  }

  isInOptions(selection: Selection) {
    // Returns selection that matches a selection in defaults or saved selections or undefined
    return this.selectionOptions.flatMap(o=>o.options).find(sel=>selectionsEqual(sel,selection));
  }

  isSavedSelection(selection: Selection){
    // Returns the selection that matches a saved selection or undefined
    return this.selectionOptions[1].options.find(sel=>selectionsEqual(sel,selection));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['geneGraphic']) {
      this.allRegionsSelection.ids_list = this.geneGraphic.regions.map(
        (r) => r.id
      )
      this.allFeaturesSelection.ids_list = this.geneGraphic.regions.flatMap(
        (r) => r.features.flatMap((f) => f.id)
      )
    }
  }

  ngOnInit(): void {
    this.selectCtrl.setValue(this.emptySelection)
    getCurrentSavedSelections(this.db).subscribe((savedSelections) => {
      this.savedSelections.length = 0; //Keep the reference and don't make a new array
      this.savedSelections.push(...savedSelections.map((sel)=>sel.selection));
    })
    this.sel.selection$.subscribe((selection) => {
      const matching_sel = this.isInOptions(selection)
      if (matching_sel) this.selectCtrl.setValue(matching_sel, {emitEvent:false});
      else this.selectCtrl.setValue(selection, {emitEvent:false});
    })
    this.selectCtrl.valueChanges.subscribe((selectedValue:Selection) => {
      if(selectedValue){
        this.sel.selectGroup(selectedValue);
      }
    })
  }
}
