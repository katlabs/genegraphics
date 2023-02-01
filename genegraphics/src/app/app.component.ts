import { Component, OnInit } from '@angular/core';
import { DatabaseService, GeneGraphic } from './database.service';
import { liveQuery } from 'dexie';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  geneGraphic: GeneGraphic | undefined;

  constructor(private db: DatabaseService){}

  ngOnInit(): void {
    liveQuery(()=> this.db.geneGraphics
      .orderBy('opened')
      .toArray())
      .subscribe(val => {
        let lastOpened = val.at(-1);
        if(lastOpened){
          this.geneGraphic = lastOpened;
        }
    })
  }
}
