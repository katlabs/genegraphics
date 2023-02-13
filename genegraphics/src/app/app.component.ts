import { Component, OnInit } from '@angular/core'
import { DatabaseService } from './database.service'
import { GeneGraphic } from './models'
import { NcbiFetchService } from './ncbi-fetch.service'
import { SelectionService } from './selection.service'
import { getCurrentGeneGraphic, getDataFetches } from './utils'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  geneGraphic: GeneGraphic | undefined

  constructor(
    private db: DatabaseService,
    private sel: SelectionService,
    private ncbiFetch: NcbiFetchService
  ) {}

  fetchIsOld(lastFetch:number){
    //Re-fetch monthly
    const limit = 2629746000;
    const msSince = Date.now() - lastFetch;
    if(msSince > limit) return true;
    else return false;
  }

  ngOnInit(): void {
    getCurrentGeneGraphic(this.db).subscribe((val) => {
      this.geneGraphic = val
      this.sel.reEmitSelection()
      console.log(this.geneGraphic)
    })
    getDataFetches(this.db).then((df) => {
      if (df.length === 0) {
        console.log("No data...")
        this.ncbiFetch.fetchNcbiGenomes(false)
      } else if (this.fetchIsOld(df[0].last_fetch)){
        console.log("Data too old...")
        this.ncbiFetch.fetchNcbiGenomes(true)
      }
    })
  }
}
