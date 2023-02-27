import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Tab {
  index: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class EditorService {
  tabIndex$: BehaviorSubject<Tab> = new BehaviorSubject({
    index: 0,
    name: 'about',
  });
  private tabsHash: { [key: string]: number } = {
    about: 0,
    data: 1,
    global: 2,
    selections: 3,
    export: 4,
  };

  constructor() {}
  getKeyByValue(object: any, value: any) {
    return Object.keys(object).find((key) => object[key] === value);
  }

  openTab(tab: string | number) {
    if (typeof tab == 'string') {
      this.tabIndex$.next({ index: this.tabsHash[tab], name: tab });
    } else {
      const name = this.getKeyByValue(this.tabsHash, tab);
      if (name) this.tabIndex$.next({ index: tab, name: name });
    }
  }
}
