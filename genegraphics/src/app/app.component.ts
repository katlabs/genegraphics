import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '@services/database.service';
import { Feature, GeneGraphic } from '@models/models';
import { NcbiFetchService } from '@services/ncbi-fetch.service';
import { SelectionService } from '@services/selection.service';
import { MouseoverInfoService } from './shared/services/mouseover-info.service';
import { getCurrentGeneGraphic, getDataFetches } from '@helpers/utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  geneGraphic: GeneGraphic | undefined;
  mouseOverFeature: Feature | null = null;

  constructor(
    private db: DatabaseService,
    private sel: SelectionService,
    private ncbiFetch: NcbiFetchService,
    private mouse: MouseoverInfoService
  ) {}

  fetchIsOld(lastFetch: number) {
    //Re-fetch monthly
    const limit = 2629746000;
    const msSince = Date.now() - lastFetch;
    if (msSince > limit) return true;
    else return false;
  }

  ngOnInit(): void {
    this.mouse.feature$.subscribe((feature) => {
      this.mouseOverFeature = feature;
    });
    getCurrentGeneGraphic(this.db).subscribe((val) => {
      this.geneGraphic = val;
      this.sel.reEmitSelection();
    });
    getDataFetches(this.db).then((df) => {
      if (df.length === 0) {
        this.ncbiFetch.fetchNcbiGenomes(false);
      } else if (this.fetchIsOld(df[0].last_fetch)) {
        this.ncbiFetch.fetchNcbiGenomes(true);
      }
    });
  }
}
