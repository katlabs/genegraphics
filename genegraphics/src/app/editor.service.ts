import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EditorService {

  selectedFeatures: number[] = new Array();

  constructor() { }

  deselectFeatures(){
    this.selectedFeatures = [];
  }

  selectFeature(id: number, multi: boolean){
    if(multi && this.selectedFeatures.includes(id)){
        this.selectedFeatures = this.selectedFeatures.filter(item => item !== id);
    } else if(multi){
      this.selectedFeatures.push(id);
    } else {
      this.selectedFeatures = [id]
    }
  }
}
