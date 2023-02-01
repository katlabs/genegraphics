import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-ncbi-fetch',
  templateUrl: './ncbi-fetch.component.html',
  styleUrls: ['./ncbi-fetch.component.scss']
})
export class NcbiFetchComponent {

  ncbiForm = new FormGroup({
    searchTypeCtrl: new FormControl(),
    geneIdCtrl: new FormControl(),
    proteinIdCtrl: new FormControl(),
    organismCtrl: new FormControl(),
    geneNameCtrl: new FormControl(),
    regionSizeCtrl: new FormControl(),
    regionStartCtrl: new FormControl(),
    regionEndCtrl: new FormControl()

  })

}
