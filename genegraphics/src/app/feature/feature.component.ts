import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Feature } from '../database.service';
import { EditorService } from '../editor.service';

@Component({
  selector: 'svg:g[app-feature]',
  templateUrl: './feature.component.svg',
  styleUrls: ['./feature.component.scss']
})
export class FeatureComponent implements OnChanges{
  @Input() feature!: Feature;
  @Input() feature_height!: number;
  @Input() feature_length!: number;

  public flipped = false;

  constructor(private editorService: EditorService){}

  getFeaturePoints(){
    let d = "";
    if (this.feature.shape =="arrow"){
      d = this.getArrow();
    }
    return d;
  }

  getFill(){
    if (this.feature.color2){
      return "url(#twocolors)"
    } else {
      return this.feature.color1;
    }
  }

  getArrow(): string{
    let arrowHeadLength = this.feature_length*0.2;
    let lineLength = this.feature_length - arrowHeadLength;
    let lineHeight = this.feature_height*0.8;
    let d: any[] = [];
    if (!this.flipped){
      d = [
        'm', 0, (this.feature_height/2)-(lineHeight/2),
        'h', lineLength,
        'v', -(this.feature_height-lineHeight),
        'L', this.feature_length, this.feature_height/2,
        'L', lineLength, this.feature_height,
        'v', -(this.feature_height-lineHeight),
        'H', 0,
        'Z'
      ];
    } else {
      d = [
        'm', this.feature_length, (this.feature_height/2)-(lineHeight/2),
        'h', -lineLength,
        'v', -(this.feature_height-lineHeight),
        'L', 0, this.feature_height/2,
        'L', arrowHeadLength, this.feature_height,
        'v', -(this.feature_height-lineHeight),
        'H', this.feature_length,
        'Z'
      ];
    }
    return d.join(" ");
  }

  getStrokeColor(): string{
    if (this.feature.id &&
      this.editorService.currentSelectionType == "feature" &&
      this.editorService.currentSelectionIds.includes(this.feature.id)){
      return "red";
    } else {
      return "black";
    }
  }

  onClickFeature(e: any){
    if (!this.feature.id){
      throw new Error('Undefined feature clicked');
    }
    this.editorService.selectItem(this.feature.id, 'feature', e.ctrlKey);
    e.stopPropagation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['feature']){
      let current_feature = changes['feature'].currentValue;
      this.flipped = current_feature.start > current_feature.stop;
    }
  }
}
