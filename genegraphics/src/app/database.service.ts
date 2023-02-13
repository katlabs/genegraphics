import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { DataFetch, GeneGraphic } from './models';
import { createGeneGraphic } from './utils';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {

  public geneGraphics!: Table<GeneGraphic, string>;
  public dataFetches!: Table<DataFetch, string>;

  constructor(
  ) {
    super('GeneGraphicsDB');
    const db = this;

    db.version(1).stores({
      geneGraphics: '&id, opened',
      dataFetches: '&id'
    })
    db.on('populate', () => db.populate());
  }

  async populate() {
    return await createGeneGraphic(this);
  }


}
