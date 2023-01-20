import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { getWindowWidth } from './utils/window';

export interface TextProps {
  show: boolean;
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  posHor?: string;
  posVert?: string;
}

export interface Feature {
  id?: number;
  regionId: number;
  name: string;
  nameProps?: TextProps;
  start: number;
  stop: number;
  length: number;
  shape?: string;
}

export interface Region {
  id?: number;
  geneGraphicId: number;
  name: string;
  nameProps?: TextProps;
  position: number;
  lanes?: number;
}

export interface GeneGraphic {
  id?: number;
  title: string;
  opened: number;
  width: number;
  featureHeight?: number;
  showScale?: boolean;
  multilane?: boolean;
  gaps?: boolean;
  overlap?: boolean;
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
    opened: Date.now(),
    width: getWindowWidth(),
    featureHeight: 50,
    showScale: true,
    multilane: true,
    gaps: true,
    overlap: true
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
