import { Component, Input } from '@angular/core'
import { GeneGraphic, Region } from '../models'
import { SelectionService } from '../selection.service';

@Component({
  selector: 'app-gene-graphic',
  templateUrl: './gene-graphic.component.svg',
  styleUrls: ['./gene-graphic.component.scss'],
})
export class GeneGraphicComponent {
  @Input() geneGraphic!: GeneGraphic

  constructor(
    private sel: SelectionService
  ) {}

  getSvgHeight() {
    let height = 0;
    height += this.getRegionsY();
    height += this.getRegionY(this.geneGraphic.regions.length+1);
    return height;
  }

  getTitleY(){
    if(this.geneGraphic.titleProps.show){
      return this.geneGraphic.titleProps.fontSize;
    }else{
      return 0;
    }
  }

  getScaleY(){
    if(!this.geneGraphic.showScale) return 0;
    let y = 10;
    if(this.geneGraphic.titleProps.show) y+= this.geneGraphic.titleProps.fontSize;
    return y
  }

  getRegionsY(){
    if(this.geneGraphic.showScale) return 60 + this.getScaleY();
    else return this.getScaleY();
  }

  getRegionsTransform(){
    return `translate(0,${this.getRegionsY()})`;
  }

  getRegionY(pos: number){
    let y = 0;
    const buffer = 10;
    for (let i=1; i<pos; i++){
      const region = this.geneGraphic.regions[i-1];
      const region_name = region.nameProps.show ? region.nameProps.fontSize + 10 : 0;
      const lane_size = this.geneGraphic.featureHeight+buffer;
      const lanes = region.lanes;
      y += region_name + lanes*lane_size;
    }
    return y
  }

  getRegionTransform(region: Region){
    return `translate(0,${this.getRegionY(region.position)})`;
  }

  getScaleTransform() {
    return `translate(0,${this.getScaleY()})`
  }

  bpToPx(bp: number) {
    return bp * this.geneGraphic.scale_ratio;
  }

  getScalePoints() {
    let width = this.bpToPx(1000);
    return `10,10,10,25,${width},25,${width},10`
  }

  editGeneGraphic(e: any){
    e.stopPropagation();
    if(this.geneGraphic.id){
      this.sel.selectItem(this.geneGraphic.id, "geneGraphic", e.ctrlKey);
    }else{
      this.sel.deselectAll();
    }
  }

}
