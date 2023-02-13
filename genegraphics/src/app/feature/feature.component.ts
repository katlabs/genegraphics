import { Component, Input, OnInit } from '@angular/core'
import { Feature } from '../models'
import { SelectionService } from '../selection.service'

@Component({
  selector: 'svg:g[app-feature]',
  templateUrl: './feature.component.svg',
  styleUrls: ['./feature.component.scss'],
})
export class FeatureComponent implements OnInit{
  @Input() feature!: Feature
  @Input() feature_height!: number
  @Input() feature_length!: number
  @Input() isFlipped!: boolean

  isSelected = false;

  constructor(private sel: SelectionService) {}

  getFeaturePoints() {
    let d = ''
    if (this.feature.shape == 'arrow') {
      d = this.getArrow()
    } else if(this.feature.shape == 'tag'){
      d = this.getTag();
    } else if(this.feature.shape == 'narrow tag'){
      d = this.getNarrowTag();
    } else if(this.feature.shape == 'bar'){
      d = this.getBar();
    } else if(this.feature.shape == 'narrow bar'){
      d = this.getNarrowBar();
    }
    return d
  }

  fillGradientName(){
    return `colorstop-${this.feature.id}`;
  }

  getFill() {
    if (this.feature.color2!=null) {
      return `url(#${this.fillGradientName()})`
    } else {
      return this.feature.color1
    }
  }

  getArrowHeadLength(){
    const max_length = this.feature_height/1.5;
    if(this.feature_length < max_length) return this.feature_length;
    else return max_length;
  }

  getArrow(): string {
    let arrowHeadLength = this.getArrowHeadLength();
    let lineLength = this.feature_length - arrowHeadLength
    let lineHeight = this.feature_height * 0.7
    let d: string = "";
    if (!this.isFlipped) {
      d = `m 0 ${this.feature_height/2-lineHeight/2} ` +
        `h ${lineLength} ` +
        `v ${-(this.feature_height/2 - lineHeight/2)} ` +
        `L ${this.feature_length} ${this.feature_height / 2} ` +
        `L ${lineLength} ${this.feature_height} ` +
        `v ${-(this.feature_height/2 - lineHeight/2)} ` +
        'H 0 ' +
        'Z'
    } else {
      d = `m ${this.feature_length} ${this.feature_height/2-lineHeight/2} ` +
        `h ${-lineLength}` +
        `v ${-(this.feature_height/2 - lineHeight/2)}`+
        `L 0 ${this.feature_height / 2}` +
        `L ${arrowHeadLength} ${this.feature_height}` +
        `v ${-(this.feature_height/2 - lineHeight/2)}` +
        `H ${this.feature_length}` +
        'Z'
    }
    return d;
  }
  getNarrowTag(): string {
    let arrowHeadLength = this.getArrowHeadLength();
    let lineLength = this.feature_length - arrowHeadLength;
    let lineHeight = this.feature_height*0.8;
    let d: string = "";
    if (!this.isFlipped) {
      d = `m 0 ${this.feature_height/2-lineHeight/2}` +
        `h ${lineLength}` +
        `L ${this.feature_length} ${this.feature_height / 2}` +
        `L ${lineLength} ${lineHeight}` +
        'H 0' +
        'Z'
    } else {
      d = `m ${this.feature_length} ${this.feature_height/2-lineHeight/2}` +
        `h ${-lineLength}` +
        `L 0 ${this.feature_height / 2}` +
        `L ${arrowHeadLength} ${lineHeight}` +
        `H ${this.feature_length}` +
        'Z'
    }
    return d;
  }

  getTag(): string {
    let arrowHeadLength = this.getArrowHeadLength();
    let lineLength = this.feature_length - arrowHeadLength;
    let d: string = "";
    if (!this.isFlipped) {
      d = `m 0 0` +
        `h ${lineLength}` +
        `L ${this.feature_length} ${this.feature_height / 2}` +
        `L ${lineLength} ${this.feature_height}` +
        'H 0' +
        'Z'
    } else {
      d = `m ${this.feature_length} 0` +
        `h ${-lineLength}` +
        `L 0 ${this.feature_height / 2}` +
        `L ${arrowHeadLength} ${this.feature_height}` +
        `H ${this.feature_length}` +
        'Z'
    }
    return d; 
  }

  getBar(): string {
    let d: string = "";
    d = `m 0 0` +
    `h ${this.feature_length}` +
    `v ${this.feature_height}` +
    `H 0` + 
    'Z'
    return d;
  }
  
  getNarrowBar(): string {
    let d: string = "";
    let lineHeight = this.feature_height*0.8;
    d = `m 0 ${this.feature_height/2-lineHeight/2}` +
        `h ${this.feature_length}` +
        `V ${lineHeight}` +
        'H 0' +
        'Z'
    return d
   }

  getNameAnchor(){
    const pos = this.feature.nameProps.posHor;
    if(pos === 'left') return 'start'
    else if(pos === 'right') return 'end'
    else return 'middle'
  }

  getNameX(){
    const pos = this.feature.nameProps.posHor;
    let start = 0;
    let mid = this.feature_length/2;
    let end = this.feature_length;
    if(['arrow','tag','narrow tag'].includes(this.feature.shape) && 
      this.feature.nameProps.posVert==='center'){
      if(!this.isFlipped){
        start = 0;
        end = this.feature_length-this.getArrowHeadLength()
        mid = (this.feature_length-this.getArrowHeadLength())/2
      }else {
        start = this.getArrowHeadLength()
        mid = (this.feature_length+this.getArrowHeadLength())/2
      }
    }
    if(pos === 'left') return start;
    if(pos === 'center') return mid;
    else return end;
  }

  getNameY(){
    if(this.feature.nameProps.posVert ==='above') return -this.feature.nameProps.fontSize/1.5;
    else if(this.feature.nameProps.posVert ==='center'){
      return this.feature_height/2;
    }else{
      return this.feature_height + this.feature.nameProps.fontSize/1.5;
    }
  }

  getStrokeColor(): string {
    return this.isSelected ? 'red' : 'black'
  }
  getStrokeWidth(): string {
    return this.isSelected ? '2' : '1'
  }

  onClickFeature(e: MouseEvent) {
    e.stopPropagation();
    const multi = e.ctrlKey || e.shiftKey || e.metaKey || e.altKey;
    this.sel.selectItem(this.feature.id, 'feature', multi);
  }

  ngOnInit(): void {
    this.sel.selection$.subscribe(selection=>{
      this.isSelected = (selection.type==="feature" && selection.ids_list.includes(this.feature.id));
    })
  }
}
