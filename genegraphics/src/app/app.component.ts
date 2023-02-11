import { Component, OnInit } from '@angular/core';
import { DatabaseService } from './database.service';
import { GeneGraphic } from './models';
import { SelectionService } from './selection.service';
import { getCurrentGeneGraphic } from './utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  geneGraphic: GeneGraphic | undefined;

  constructor(
    private db: DatabaseService,
    private sel: SelectionService
  ){}

  ngOnInit(): void {
    getCurrentGeneGraphic(this.db)
      .subscribe(val => {
        this.geneGraphic=val;
        this.sel.reEmitSelection();
        console.log(this.geneGraphic);
      })
  }
}
