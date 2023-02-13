import { Component, Input, ViewChild, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GeneGraphic } from '../models';
import { DatabaseService } from '../database.service';
import { createGeneGraphic, deleteGeneGraphic, timeAgo } from '../utils';
import { liveQuery } from 'dexie';
import { MatSelect } from '@angular/material/select';
import { JsonImportService } from '../json-import.service';

@Component({
  selector: 'app-editor-data',
  templateUrl: './editor-data.component.html',
  styleUrls: ['./editor-data.component.scss']
})
export class EditorDataComponent implements OnInit, OnChanges {
  @Input() geneGraphic!: GeneGraphic;
  @ViewChild('selectEl') selectEl!: MatSelect;
  geneGraphics: GeneGraphic[] = [];
  selectCtrl = new FormControl();

  constructor( 
    private db: DatabaseService, 
    private jsonImport: JsonImportService
  ){}

  onClickDelete(){
    deleteGeneGraphic(this.db, this.geneGraphic);
  }

  getDateStr(opened:number){
    const d = new Date(opened);
    const str = timeAgo(d);
    return str;
  }

  onSelect(e: any){
    if(e.value==0){
      console.log("add new");
      createGeneGraphic(this.db);
    } else {
      this.db.geneGraphics.update(e.value, {
        opened: Date.now()
      })
    }
  }

  ngOnInit(): void {
    liveQuery(()=>this.db.geneGraphics.toArray())
      .subscribe(geneGraphics=>{
        this.geneGraphics = geneGraphics;
      });
    this.jsonImport.jsonImported$.subscribe(val=>{
      if(val && this.selectEl) this.selectEl.open();
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes["geneGraphic"]){
      this.selectCtrl.setValue(this.geneGraphic.id, {emitEvent:false});
    }
  }

}
