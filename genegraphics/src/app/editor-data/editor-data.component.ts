import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GeneGraphic } from '../models';
import { DatabaseService } from '../database.service';
import { createGeneGraphic, deleteGeneGraphic } from '../utils/db-functions';
import { liveQuery } from 'dexie';

@Component({
  selector: 'app-editor-data',
  templateUrl: './editor-data.component.html',
  styleUrls: ['./editor-data.component.scss']
})
export class EditorDataComponent implements OnInit, OnChanges {
  @Input() geneGraphic!: GeneGraphic;
  geneGraphics: GeneGraphic[] = [];
  selectCtrl = new FormControl();

  constructor( private db: DatabaseService ){}

  onClickDelete(){
    deleteGeneGraphic(this.db, this.geneGraphic);
  }

  onSelect(e: any){
    if(e.value==0){
      console.log("add new");
      createGeneGraphic(this.db);
    } else {
      this.db.geneGraphics.update(parseInt(e.value), {
        opened: Date.now()
      })
    }
  }

  ngOnInit(): void {
    liveQuery(()=>this.db.geneGraphics.toArray())
      .subscribe(geneGraphics=>{
        this.geneGraphics = geneGraphics;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes["geneGraphic"]){
      this.selectCtrl.setValue(this.geneGraphic.id);
    }
  }

}
