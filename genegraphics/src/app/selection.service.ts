import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EditorService } from './editor.service';
import { Selection } from './models';

@Injectable({
  providedIn: 'root',
})
export class SelectionService {
  selection$: BehaviorSubject<Selection> = new BehaviorSubject({
    type: 'empty',
    ids_list: [] as string[],
  });

  constructor(private editorService: EditorService) {}

  deselectAll() {
    this.selection$.next({
      type: 'empty',
      ids_list: [],
    });
  }

  reEmitSelection() {
    this.selection$.next({
      type: this.selection$.getValue().type,
      ids_list: this.selection$.getValue().ids_list,
    });
  }

  selectItem(id: string, selectionType: string, select_multi: boolean) {
    const currentType = this.selection$.getValue().type;
    const currentIds = this.selection$.getValue().ids_list;
    if (currentType != selectionType) {
      this.selection$.next({
        type: selectionType,
        ids_list: [id],
      });
    } else if (select_multi && currentIds.includes(id)) {
      this.selection$.next({
        type: currentIds.length === 0 ? 'empty' : currentType,
        ids_list: currentIds.filter((x) => x !== id),
      });
    } else if (select_multi) {
      this.selection$.next({
        type: selectionType,
        ids_list: [...currentIds, id],
      });
    } else {
      this.selection$.next({
        type: selectionType,
        ids_list: [id],
      });
    }

    if (
      this.selection$.getValue().type !== 'geneGraphic' &&
      this.selection$.getValue().type !== 'empty'
    ) {
      this.editorService.openTab('selections');
    } else {
      this.editorService.openTab('global');
    }
  }

  selectGroup(selection: Selection) {
    this.selection$.next({
      type: selection.type,
      ids_list: selection.ids_list,
    });
  }
}
