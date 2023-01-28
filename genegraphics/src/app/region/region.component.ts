import { Component, Input, OnInit } from '@angular/core';
import { Region, Feature, DatabaseService, GeneGraphic } from '../database.service';
import { liveQuery } from 'dexie';

@Component({
  selector: 'svg:g[app-region]',
  templateUrl: './region.component.svg',
  styleUrls: ['./region.component.scss']
})
export class RegionComponent implements OnInit {
  @Input() region!: Region;
  @Input() geneGraphic!: GeneGraphic;
  @Input() bpToPxRatio!: number;
  features$ = liveQuery(() => this.getFeatures());

  constructor(private db: DatabaseService){}

  getFeatureTransform(feat: Feature){
    let begin = feat.start<feat.stop ? feat.start : feat.stop;
    let x = this.bpToPx(begin - this.region.start);
    let lane = this.geneGraphic.multilane ? feat.lane-1 : 0;
    let y = lane*(this.geneGraphic.featureHeight+5) + 20;
    return `translate(${x},${y})`;
  }

  bpToPx(x: number){
    return x*this.bpToPxRatio;
  }

  getFeatureLength(feat: Feature){
    return this.bpToPx(feat.length);
  }

  async getFeatures() {
    return await this.db.features.where({regionId: this.region.id}).toArray();
  }

  ngOnInit(): void {
    this.features$.subscribe(feats=>{
      //this.fillLaneNumbers(feats);
    })
  }

}
