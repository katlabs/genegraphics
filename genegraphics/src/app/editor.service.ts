import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class EditorService {
  tabIndex$ = new BehaviorSubject(0);
  private tabsHash: { [key: string]: number } = {
    data: 0,
    settings: 1,
    export: 2,
  }

  constructor() {}

  openTab(tab: string | number) {
    if (typeof tab == 'string') {
      this.tabIndex$.next(this.tabsHash[tab]);
    } else {
      this.tabIndex$.next(tab);
    }
  }
}
