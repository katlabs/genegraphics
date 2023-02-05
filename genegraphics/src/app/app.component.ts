import { Component, OnInit } from '@angular/core';
import { DatabaseService } from './database.service';
import { GeneGraphic } from './models';
import { getCurrentGeneGraphic } from './utils/db-functions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  geneGraphic: GeneGraphic | undefined;

  constructor(private db: DatabaseService){}

  ngOnInit(): void {
    getCurrentGeneGraphic(this.db)
      .subscribe(val => {
        this.geneGraphic=val;
        console.log(this.geneGraphic);
      })
  }
}
