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
  color1: string;
  color2?: string;
  lane: number;
  BRC_ID: string;
  Locus_Tag: string;
  Gene_Name: string;
  Gene_ID: string;
  Protein_ID: string;
  Uniprot_Acc: string;
  Product: string;
  PATRIC_Local_Family: string;
  PATRIC_Global_Family: string;
  Product_Length: string;
}

export interface Region {
  id?: number;
  geneGraphicId: number;
  name: string;
  nameProps: TextProps;
  position: number;
  lanes: number;
  start: number;
  stop: number;
  size: number;
  Genome_ID: string;
  Genome_Name: string;
  Accession: string;
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

export interface SelectionGroup {
  id?: number;
  geneGraphicId: number;
  name: string;
  type: string;
  ids_list: number[];
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {

  geneGraphics!: Table<GeneGraphic, number>;
  regions!: Table<Region, number>;
  features!: Table<Feature, number>;
  selectionGroups!: Table<SelectionGroup, number>;

  constructor() {
    super('GeneGraphicsDB');

    this.version(1).stores({
      geneGraphics: '++id, opened',
      regions: '++id, geneGraphicId',
      features: '++id, regionId',
      selectionGroups: '++id, geneGraphicId'
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

  async getLastRegionPosition(geneGraphicId:number){
    let ordered_regions = await this.regions.where({geneGraphicId: geneGraphicId}).sortBy('position')
    let last_position = ordered_regions.at(-1)?.position;
    return last_position;
  }

  async getLastRegionId(){
    let ordered_regions = await this.regions.orderBy('id').toArray()
    let last_id = ordered_regions.at(-1)?.id;
    return last_id;
  }

  async getOrCreateGeneGraphic(newSession: boolean){
    let geneGraphicId!: number;
    if (newSession){
       geneGraphicId = await this.addNewGeneGraphic();
    } else {
      await this.geneGraphics.orderBy('opened').last().then(val=>{
        if(val?.id){
          geneGraphicId = val.id
        }
      })
    }
    if (!geneGraphicId){
      throw new Error('Cannot retrieve id of the GeneGraphic');
    }
    return geneGraphicId;
  }

  async populate() {
    return await this.addNewGeneGraphic().catch(err => console.log(err));
  }

}
