import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { importInto } from 'dexie-export-import';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JsonImportService {
  jsonImported$: Subject<boolean> = new Subject();
  constructor(
    private db: DatabaseService
  ) { }

  async importJSON(file:File){
    await importInto(this.db, file, {overwriteValues:true});
    this.jsonImported$.next(true);
    return;
  }

}
