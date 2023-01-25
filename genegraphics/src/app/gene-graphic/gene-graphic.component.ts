import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DatabaseService, GeneGraphic, Region } from '../database.service';
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
  regions: Region[] =[];
  bpToPxRatio!: number;

  constructor(private db: DatabaseService, private editorService: EditorService){}

  async getRegions() {
    return await this.db.regions.where({geneGraphicId: this.geneGraphic.id }).sortBy('position');
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

  getRegionsSpace(pos: number){
    let total_space = 0;
    if(this.regions.length >= pos){
      if (pos == 0){
        return total_space;
      } else {
        for(let i=0; i<pos; i++){
          let name_height = this.regions[i].nameProps.show ? 23 : 0;
          let lanes = this.geneGraphic.multilane? this.regions[i].lanes : 1;
          let this_space = name_height + 20 + (this.geneGraphic.featureHeight)*lanes;
          total_space += this_space;
        }
        return total_space;
      }
    } else {
      return total_space;
    }
  }

  getRegionTransform(pos: number){
    return `translate(0,${this.getHeaderSpace()+this.getRegionsSpace(pos-1)})`
  }

  getHeaderSpace(){
    let total_space = 20;
    total_space += this.geneGraphic.titleProps.show ? 23 : 0;
    total_space += this.geneGraphic.showScale ? 23 : 0;
    return total_space;
  }

  getSvgHeight(){
    let region_space = this.regions ? this.getRegionsSpace(this.regions.length) : 0;
    return this.getHeaderSpace() + region_space;
  }

  onClick(e: any){
    this.editorService.deselectFeatures();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['geneGraphic']){
      this.regions$ = liveQuery(()=> this.getRegions());
      this.regions$.subscribe((vals: any[])=>{
        this.regions = vals
        this.bpToPxRatio = this.geneGraphic.width/Math.max(...this.regions.map(o => o.size));
      });
    }
  }
}
