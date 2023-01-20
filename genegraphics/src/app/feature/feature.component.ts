import { Component, Input } from '@angular/core';
import { Feature } from '../database.service';
import { EditorService } from '../editor.service';

@Component({
  selector: 'svg:g[app-feature]',
  templateUrl: './feature.component.svg',
  styleUrls: ['./feature.component.scss']
})
export class FeatureComponent {
  @Input() feature!: Feature;
  @Input() feature_height!: number;
  @Input() feature_length!: number;

  constructor(private editorService: EditorService){}

  getFeaturePoints(){
    let arrowHeadLength = this.feature_length*0.2;
    let lineLength = this.feature_length - arrowHeadLength;
    let lineHeight = this.feature_height*0.8;

    let d = [
      'm', 0, (this.feature_height/2)-(lineHeight/2),
      'h', lineLength,
      'v', -(this.feature_height-lineHeight),
      'L', this.feature_length, this.feature_height/2,
      'L', lineLength, this.feature_height,
      'v', -(this.feature_height-lineHeight),
      'H', 0,
      'Z'
      ];
    return d.join(" ");
  }

  getStrokeColor(): string{
    if (this.feature.id && this.editorService.selectedFeatures.includes(this.feature.id)){
      return "red";
    } else {
      return "black";
    }
  }

  onClickFeature(e: any){
    if (!this.feature.id){
      throw new Error('Undefined feature clicked');
    }
    if (e.ctrlKey){
      this.editorService.selectFeature(this.feature.id, true);
    } else {
      this.editorService.selectFeature(this.feature.id, false);
    }
    e.stopPropagation();
  }
}
