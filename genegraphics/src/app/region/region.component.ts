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
  @Input() svg_width!: number;
  @Input() geneGraphic!: GeneGraphic;
  features$ = liveQuery(() => this.getFeatures());
  offset = 0;
  region_size = 0;

  constructor(private db: DatabaseService){}

  getFeatureTransform(feat: Feature){
    let begin = feat.start<feat.stop ? feat.start : feat.stop;
    let x = this.bpToPx(begin - this.offset);
    return `translate(${x},30)`;
  }

  bpToPx(x: number){
    return x*(this.geneGraphic.width/this.region_size);
  }

  getFeatureLength(feat: Feature){
    return this.bpToPx(feat.length);
  }

  async getFeatures() {
    return await this.db.features.where({regionId: this.region.id}).toArray();
  }

  ngOnInit(): void {
    this.features$.subscribe(feats=>{
      if(feats.length != 0){
        let first_bp = feats[0].start;
        let last_bp = feats[0].stop;
        feats.forEach(feat=>{
          first_bp = feat.start < first_bp ? feat.start : feat.stop < first_bp ? feat.stop : first_bp;
          last_bp = feat.start > last_bp ? feat.start : feat.stop > last_bp ? feat.stop : last_bp;
        })
        this.offset = first_bp;
        this.region_size = last_bp - first_bp;
      }
    })
  }

}
