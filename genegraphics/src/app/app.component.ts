import { Component, OnInit } from '@angular/core';
import { DatabaseService, GeneGraphic } from './database.service';
import { liveQuery } from 'dexie';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'genegraphics';
  geneGraphics$ = liveQuery(()=> this.getGeneGraphics());
  geneGraphic: GeneGraphic = this.db.initGeneGraphic;

  constructor(private db: DatabaseService){}

  async getGeneGraphics() {
    return await this.db.geneGraphics.orderBy('opened').toArray();
  }

  ngOnInit(): void {
    this.geneGraphics$.subscribe(val => {
      let lastOpened = val.at(-1);
      if(lastOpened){
        this.geneGraphic = lastOpened;
      }
    })
  }
}
