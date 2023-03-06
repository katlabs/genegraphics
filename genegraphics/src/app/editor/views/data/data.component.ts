import {
  Component,
  Input,
  ViewChild,
  OnInit,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { GeneGraphic } from '@models/models';
import { DatabaseService } from '@services/database.service';
import { createGeneGraphic, deleteGeneGraphic, timeAgo } from '@helpers/utils';
import { liveQuery } from 'dexie';
import { MatSelect } from '@angular/material/select';
import { JsonImportService } from '@services/json-import.service';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';

@Component({
  selector: 'editor-data',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.scss'],
})
export class DataComponent implements OnInit, OnChanges {
  @Input() geneGraphic!: GeneGraphic;
  @ViewChild('selectEl') selectEl!: MatSelect;
  geneGraphics: GeneGraphic[] = [];
  selectCtrl = new FormControl();

  constructor(
    private db: DatabaseService,
    private jsonImport: JsonImportService
  ) {}

  onClickDelete() {
    deleteGeneGraphic(this.db, this.geneGraphic);
  }

  getDateStr(opened: number): Observable<string> {
    const d = new Date(opened);
    const str = timeAgo(d);
    return of(str);
  }

  onSelect(e: any) {
    if (e.value == 0) {
      createGeneGraphic(this.db);
    } else {
      this.db.geneGraphics.update(e.value, {
        opened: Date.now(),
      });
    }
  }

  ngOnInit(): void {
    liveQuery(() => this.db.geneGraphics.toArray()).subscribe(
      (geneGraphics) => {
        this.geneGraphics = geneGraphics;
      }
    );
    this.jsonImport.jsonImported$.subscribe((val) => {
      if (val && this.selectEl) this.selectEl.open();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['geneGraphic']) {
      this.selectCtrl.setValue(this.geneGraphic.id, { emitEvent: false });
    }
  }
}
