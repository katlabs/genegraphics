import { Component, Input } from '@angular/core';
import { GeneGraphic, Region, Feature } from '../models';

@Component({
  selector: 'svg:g[app-region]',
  templateUrl: './region.component.svg',
  styleUrls: ['./region.component.scss']
})
export class RegionComponent {
  @Input() region!: Region;
  @Input() geneGraphic!: GeneGraphic;

  constructor(
  ){}

  getFeatureTransform(feature: Feature){
    return `translate(${this.getFeatureX(feature)},${this.getFeatureY(feature)})`;
  }

  getFeatureX(feature: Feature){
    return feature.first_bp*this.geneGraphic.scale_ratio;
  }

  getFeatureY(feature: Feature){
    const region_name = this.region.nameProps.show ? this.region.nameProps.fontSize : 0;
    const buffer = 10;
    return (feature.lane-1)*(this.geneGraphic.featureHeight) + region_name + buffer;
  }

  getFeatureLength(feature: Feature){
    return feature.size*this.geneGraphic.scale_ratio;
  }

  onClickRegion(e: any){
  }


}
