import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { EditorService } from './editor.service'
import { Selection } from './models'

@Injectable({
  providedIn: 'root',
})
export class SelectionService {
  selection$: BehaviorSubject<Selection> = new BehaviorSubject({
    type: 'empty',
    ids_list: [] as (string | number)[],
  })

  constructor(private editorService: EditorService) {}

  deselectAll() {
    this.selection$.next({
      type: 'none',
      ids_list: [],
    })
  }

  reEmitSelection(){
    this.selection$.next({
      type: this.selection$.getValue().type,
      ids_list: this.selection$.getValue().ids_list
    })
  }

  selectItem(
    id: string | number,
    selectionType: string,
    select_multi: boolean
  ) {
    const currentType = this.selection$.getValue().type
    const currentIds = this.selection$.getValue().ids_list
    if (currentType != selectionType) {
      this.selection$.next({
        type: selectionType,
        ids_list: [id],
      })
      this.editorService.openTab('settings')
    } else if (select_multi && currentIds.includes(id)) {
      this.selection$.next({
        type: currentIds.length === 0 ? 'empty' : currentType,
        ids_list: currentIds.filter((x) => x !== id),
      })
    } else if (select_multi) {
      this.selection$.next({
        type: selectionType,
        ids_list: [...currentIds, id],
      })
      this.editorService.openTab('settings')
    } else {
      this.selection$.next({
        type: selectionType,
        ids_list: [id],
      })
      this.editorService.openTab('settings')
    }
  }

  selectGroup(selection: Selection) {
    this.selection$.next({
      type: selection.type,
      ids_list: selection.ids_list,
    })
  }
}
