import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface TextProps {
  show: boolean;
  bold: boolean;
  italic: boolean;
  fontSize: number;
  fontFamily: string;
  color: string;
  posHor: string;
  posVert: string;
}

export interface Feature {
  id?: number;
  regionId: number;
  name: string;
  nameProps: TextProps;
  start: number;
  stop: number;
  length: number;
  shape: string;
  lane: number;
}

export interface Region {
  id?: number;
  geneGraphicId: number;
  name: string;
  nameProps: TextProps;
  position: number;
  lanes: number;
  size: number;
  offset: number;
}

export interface GeneGraphic {
  id?: number;
  title: string;
  opened: number;
  width: number;
  titleProps: TextProps;
  featureHeight: number;
  showScale: boolean;
  multilane: boolean;
  gaps: boolean;
  overlap: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {

  geneGraphics!: Table<GeneGraphic, number>;
  regions!: Table<Region, number>;
  features!: Table<Feature, number>;

  constructor() {
    super('GeneGraphicsDB');

    this.version(1).stores({
      geneGraphics: '++id, opened',
      regions: '++id, geneGraphicId',
      features: '++id, regionId'
    })
    this.on('populate', () => this.populate());
  }

  makeNewTextProps(){
    return {
      show: true,
      bold: false,
      italic: false,
      fontSize: 12,
      fontFamily: "Arial, sans-serif",
      color: "#000000",
      posHor: "left",
      posVert: "above"
    }
  }

  async addNewGeneGraphic(){
    return await this.geneGraphics.add(this.makeNewGeneGraphic());
  }

  makeNewGeneGraphic(title?: string, titleProps?: TextProps, width?: number, featureHeight?: number, showScale?: boolean, multilane?: boolean, gaps?: boolean, overlap?: boolean){
    return {
      title: title ? title : "New GeneGraphic",
      titleProps: titleProps? titleProps : this.makeNewTextProps(),
      opened: Date.now(),
      width: width ? width : 1000,
      featureHeight: featureHeight ? featureHeight : 50,
      showScale: showScale ? showScale : true,
      multilane: multilane ? multilane : true,
      gaps: gaps ? gaps : true,
      overlap: overlap ? overlap : true
    }
  }

  async populate() {
    return await this.addNewGeneGraphic();
  }

}
