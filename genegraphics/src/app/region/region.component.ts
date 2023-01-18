import { Component, Input } from '@angular/core';
import { Region, DatabaseService } from '../database.service';
import { liveQuery } from 'dexie';

@Component({
  selector: 'app-region',
  templateUrl: './region.component.html',
  styleUrls: ['./region.component.scss']
})
export class RegionComponent {
  @Input() region!: Region;
  features$ = liveQuery(() => this.getFeatures());

  constructor(private db: DatabaseService){}

  async getFeatures() {
    return await this.db.features.where({regionId: this.region.id}).toArray();
  }
}
