import { Injectable } from '@angular/core';
import { DatabaseService, GeneGraphic, SelectionGroup } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class EditorService {

  tabIndex = 0;
  currentSelectionIds: number[] = [];
  currentSelectionType: string = "empty";
  currentSelectionItems: any[] = [];

  constructor(private db: DatabaseService) {}


  deselectAll(){
    this.currentSelectionType = "empty";
    this.currentSelectionIds = [];
  }

  getCurrentFeatures(){
    this.db.features.where('id').anyOf(this.currentSelectionIds).toArray()
    .then(vals=>this.currentSelectionItems = vals)
  }

  selectItem(id: number, selectionType: string, select_multi: boolean){
    console.log(selectionType);
    console.log(this.currentSelectionType);
    if (this.currentSelectionType != selectionType){
      this.currentSelectionType = selectionType;
      this.currentSelectionIds = [id];
      this.tabIndex = 1;
    } else if (select_multi && this.currentSelectionIds.includes(id)){
      this.currentSelectionIds = this.currentSelectionIds.filter(x=> x!==id);
      if (this.currentSelectionIds.length === 0) this.currentSelectionType = "empty";
    } else if (select_multi){
      this.currentSelectionIds.push(id);
      this.tabIndex = 1;
    } else {
      console.log("not multi");
      this.currentSelectionIds = [id];
      this.tabIndex = 1;
    }
    if(this.currentSelectionType=="feature") this.getCurrentFeatures();
  }

  async getSavedSelectionGroups(){
    return await this.db.selectionGroups.toArray();
  }
  
}
