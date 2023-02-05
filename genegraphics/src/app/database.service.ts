import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { GeneGraphic, SelectionGroup } from './models';
import { createGeneGraphic } from './utils/db-functions';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {

  public geneGraphics!: Table<GeneGraphic, number>;
  public selectionGroups!: Table<SelectionGroup, number>;

  constructor() {
    super('GeneGraphicsDB');
    const db = this;

    db.version(1).stores({
      geneGraphics: '++id, opened',
      selectionGroups: '++id, geneGraphicId'
    })
    db.on('populate', () => db.populate());
  }

  async populate() {
    return await createGeneGraphic(this).catch(err => console.log(err));
  }

}
