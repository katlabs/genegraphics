import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface Feature {
  id?: number;
  regionId: number;
  name: string;
  start: number;
  stop: number;
  length: number;
}

export interface Region {
  id?: number;
  geneGraphicId: number;
  name: string;
}

export interface GeneGraphic {
  id?: number;
  title: string;
  opened: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {

  geneGraphics!: Table<GeneGraphic, number>;
  regions!: Table<Region, number>;
  features!: Table<Feature, number>;
  public initGeneGraphic = {
    id: 1,
    title: "New GeneGraphic",
    opened: Date.now()
  }

  constructor() {
    super('GeneGraphicsDB');

    this.version(1).stores({
      geneGraphics: '++id, opened',
      regions: '++id, geneGraphicId',
      features: '++id, regionId'
    })
    this.on('populate', () => this.populate());
  }

  async populate() {
    return await this.geneGraphics.add(this.initGeneGraphic);
  }

}
