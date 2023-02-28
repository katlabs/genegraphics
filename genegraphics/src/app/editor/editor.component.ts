import { Component, Input, OnInit } from '@angular/core'
import { Feature, GeneGraphic, Region, Selection } from '@models/models'
import { EditorService } from '@services/editor.service'
import { SelectionService } from '@services/selection.service'

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit {
  @Input() geneGraphic!: GeneGraphic
  tabIndex!: number
  selection!: Selection
  regions: Region[] = []
  features: Feature[] = []

  constructor(
    private editorService: EditorService,
    private sel: SelectionService
  ) {}

  changeTabIndex(e: number){
    this.editorService.openTab(e);
  }

  ngOnInit(): void {
    this.tabIndex = 3;
    this.editorService.tabIndex$.subscribe((tab) => (this.tabIndex = tab.index))
    this.sel.selection$.subscribe((sel) => {
      this.selection = sel
      this.regions = []
      this.features = []
      if (this.selection.type === 'feature')
        this.features = this.geneGraphic.regions
          .flatMap((r) => r.features)
          .filter((f) => this.selection.ids_list.includes(f.id))
      if (this.selection.type === 'region')
        this.regions = this.geneGraphic.regions.filter((r) =>
          this.selection.ids_list.includes(r.id)
        )
    })
  }
}
