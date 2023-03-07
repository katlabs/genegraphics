import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Feature } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class MouseoverInfoService {
  feature$: BehaviorSubject<Feature | null> =
    new BehaviorSubject<Feature | null>(null);
  constructor() {}

  clear() {
    this.feature$.next(null);
  }
  update(feature: Feature) {
    this.feature$.next(feature);
  }
}
