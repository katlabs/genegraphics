import { Injectable } from '@angular/core';
import { EditorService } from './editor.service';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {

  private selectedIds: (string|number)[] = [];
  private selectedType: string = "none";

  constructor(
    private editorService: EditorService
  ) { }

  isSelectedFeature(featureId:string): boolean{
    if(this.selectedType==="feature" && this.selectedIds.includes(featureId)){
      return true;
    } else {
      return false;
    }
  }

  deselectAll(){
    this.selectedType="none";
    this.selectedIds=[];
  }

  selectItem(id: string | number, selectionType: string, select_multi: boolean){
    if (this.selectedType != selectionType){
      this.selectedType = selectionType;
      this.selectedIds = [id];
      this.editorService.openTab("settings");
    } else if (select_multi && this.selectedIds.includes(id)){
      this.selectedIds = this.selectedIds.filter(x=> x!==id);
      if (this.selectedIds.length === 0) this.selectedType = "empty";
    } else if (select_multi){
      this.selectedIds.push(id);
      this.editorService.openTab("settings");
     } else {
      console.log("opening settings")
      this.selectedIds = [id];
      this.editorService.openTab("settings");
     }
  }

}
