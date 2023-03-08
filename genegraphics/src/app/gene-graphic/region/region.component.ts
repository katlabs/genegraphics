import { Component, Input, OnInit } from '@angular/core';
import { GeneGraphic, Region, Feature } from '@models/models';
import { SelectionService } from '@services/selection.service';
import {
  getLanesSize,
  getRegionNameHeight,
  getRegionHeight,
} from '@helpers/utils';

@Component({
  selector: 'svg:g[app-region]',
  templateUrl: './region.component.svg',
  styleUrls: ['./region.component.scss'],
})
export class RegionComponent implements OnInit {
  @Input() region!: Region;
  @Input() geneGraphic!: GeneGraphic;
  isSelected = false;

  constructor(private sel: SelectionService) {}

  getFeatureTransform(feature: Feature) {
    return `translate(${this.getFeatureX(feature)},${this.getTopOfLane(
      feature.lane
    )})`;
  }

  getFeatureX(feature: Feature) {
    return feature.first_bp * this.geneGraphic.scale_ratio;
  }

  getTopOfLane(lane: number) {
    const laneSizes = getLanesSize(this.region, this.geneGraphic.featureHeight);
    if (lane === 2) {
      return (
        getRegionNameHeight(this.region) + laneSizes.lane1 + laneSizes.lane2_top
      );
    } else if (lane === 1)
      return getRegionNameHeight(this.region) + laneSizes.lane1_top;
    else return 0;
  }

  getMiddleOfLane(lane: number) {
    return this.getTopOfLane(lane) + this.geneGraphic.featureHeight / 2;
  }

  getRegionLines() {
    let lines = [];
    if (this.region.lines > 0) lines.push({ y: this.getMiddleOfLane(1) });
    if (this.region.lines > 1) lines.push({ y: this.getMiddleOfLane(2) });
    return lines;
  }

  getRegionHeight() {
    return getRegionHeight(this.region, this.geneGraphic.featureHeight);
  }
  getFeatureLength(feature: Feature) {
    return feature.size * this.geneGraphic.scale_ratio;
  }

  isFlipped(feature: Feature) {
    if (this.region.flipped) return feature.start < feature.stop;
    else return feature.start > feature.stop;
  }

  getNameY() {
    if (!this.region.nameProps.hide) return this.region.nameProps.fontSize / 2;
    else return 0;
  }

  getNameX() {
    const paddedWidth = this.geneGraphic.width - 20;
    if (this.region.nameProps.posHor === 'center') return paddedWidth / 2 - 10;
    else if (this.region.nameProps.posHor === 'right') return paddedWidth;
    else return '0';
  }

  getNameAnchor() {
    if (this.region.nameProps.posHor === 'center') return 'middle';
    else if (this.region.nameProps.posHor === 'right') return 'end';
    else return 'start';
  }

  onClickRegion(e: MouseEvent) {
    e.stopPropagation();
    const multi = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
    this.sel.selectItem(this.region.id, 'region', multi);
  }

  ngOnInit(): void {
    this.sel.selection$.subscribe((sel) => {
      this.isSelected = sel.ids_list.includes(this.region.id);
    });
  }
}
