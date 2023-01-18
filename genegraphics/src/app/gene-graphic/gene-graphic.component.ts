import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DatabaseService, GeneGraphic } from '../database.service';
import { liveQuery } from 'dexie';

@Component({
  selector: 'app-gene-graphic',
  templateUrl: './gene-graphic.component.html',
  styleUrls: ['./gene-graphic.component.scss']
})
export class GeneGraphicComponent implements OnChanges {
  @Input() geneGraphic!: GeneGraphic;
  regions$ = liveQuery(() => this.getRegions());

  constructor(private db: DatabaseService){}

  async getRegions() {
    return await this.db.regions.where({geneGraphicId: this.geneGraphic.id }).toArray();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['geneGraphic']){
      this.regions$ = liveQuery(()=> this.getRegions())
    }
  }
}
