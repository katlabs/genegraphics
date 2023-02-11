import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { GeneGraphic, SavedSelection } from './models';
import { createGeneGraphic } from './utils';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {

  public geneGraphics!: Table<GeneGraphic, number>;
  public selections!: Table<SavedSelection, number>;

  constructor() {
    super('GeneGraphicsDB');
    const db = this;

    db.version(1).stores({
      geneGraphics: '++id, opened',
      selections: '++id, geneGraphicId, name, type, ids_list'
    })
    db.on('populate', () => db.populate());
  }

  async populate() {
    return await createGeneGraphic(this).catch(err => console.log(err));
  }

}
