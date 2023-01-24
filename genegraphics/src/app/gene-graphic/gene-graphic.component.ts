import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DatabaseService, GeneGraphic } from '../database.service';
import { EditorService } from '../editor.service';
import { liveQuery } from 'dexie';

@Component({
  selector: 'app-gene-graphic',
  templateUrl: './gene-graphic.component.svg',
  styleUrls: ['./gene-graphic.component.scss']
})
export class GeneGraphicComponent implements OnChanges {
  @Input() geneGraphic!: GeneGraphic;
  regions$: any;
  svg_height!: number;
  private top_margin = 40;
  private left_margin = 5;
  private region_height = 100;


  constructor(private db: DatabaseService, private editorService: EditorService){}

  async getRegions() {
    return await this.db.regions.where({geneGraphicId: this.geneGraphic.id }).sortBy('position');
  }

  getRegionTransform(pos: number){
    return `translate(${this.left_margin},${(pos-1)*this.region_height+this.top_margin})`
  }

  getTitleTransform(){
    return `translate(0,20)`;
  }

  getScaleTransform(){
    let y = 20;
    if (this.geneGraphic.titleProps.show){
      y += 20;
    }
    return `translate(0,${y})`;
  }

  updateSvgHeight(vals: any){
    this.svg_height = vals.length*this.region_height+this.top_margin;
  }

  onClick(e: any){
    this.editorService.deselectFeatures();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['geneGraphic']){
      this.regions$ = liveQuery(()=> this.getRegions());
      this.regions$.subscribe((vals: any[])=>this.updateSvgHeight(vals));
    }
  }
}
