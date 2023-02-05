import {
  Component,
  Input,
  OnInit,
} from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'
import { GeneGraphic } from '../models'
import { DatabaseService } from '../database.service';
import { updateGeneGraphic, updateGeneGraphicTitleProps } from '../utils/db-functions';

@Component({
  selector: 'app-editor-settings',
  templateUrl: './editor-settings.component.html',
  styleUrls: ['./editor-settings.component.scss'],
})
export class EditorSettingsComponent implements OnInit {
  @Input() geneGraphic!: GeneGraphic;
  settingsForm = this.fb.group({
    width: [
      0,
      {
        validators: [
          Validators.required,
          Validators.min(100),
          Validators.max(3000),
        ],
        updateOn: 'blur',
      },
    ],
    featureHeight: [
      0,
      {
        validators: [
          Validators.required,
          Validators.min(5),
          Validators.max(100),
        ],
        updateOn: 'blur',
      },
    ],
    showTitle: [false],
    showScale: [false],
    laneSettings: this.fb.group({
      multilane: [true],
      overlap: [false],
      gaps: [false],
    }),
  })

  constructor(
    private db: DatabaseService,
    private fb: FormBuilder
  ) {}

  checkLaneSettings(values:any){
    let newVals = values;
    if(values['multilane']===true){
      newVals['overlap']=false;
      newVals['gaps']=false;
    } else if(values['overlap']==true){
      newVals['gaps']=false;
    }
    return newVals;
  }

  ngOnInit(): void {
    this.settingsForm.get('width')?.setValue(this.geneGraphic.width);
    this.settingsForm.get('width')?.setValue(this.geneGraphic.width)
    this.settingsForm
      .get('featureHeight')
      ?.setValue(this.geneGraphic.featureHeight)
    this.settingsForm
      .get('showTitle')
      ?.setValue(this.geneGraphic.titleProps.show)
    this.settingsForm.get('showScale')?.setValue(this.geneGraphic.showScale)
    this.settingsForm
      .get('laneSettings.multilane')
      ?.setValue(this.geneGraphic.multilane)
    this.settingsForm
      .get('laneSettings.overlap')
      ?.setValue(this.geneGraphic.overlap)
    this.settingsForm
      .get('laneSettings.gaps')
      ?.setValue(this.geneGraphic.gaps)

    Object.keys(this.settingsForm.controls).forEach((key) => {
      const formCtl = this.settingsForm.get(key)
      formCtl?.valueChanges.subscribe((selectedValue) => {
        if (formCtl.status !== 'INVALID') {
          let update: {[key:string]:string} = {}
          switch (key) {
            case 'width': 
            case'featureHeight':
            case 'showScale':
              update[key] = selectedValue
              updateGeneGraphic(this.db, this.geneGraphic, update);
              break
            case 'showTitle':
              update['titleProps.show'] = selectedValue
              updateGeneGraphicTitleProps(this.db, this.geneGraphic, update);
              break
            case 'laneSettings':
              update = this.checkLaneSettings(selectedValue)
              updateGeneGraphic(this.db, this.geneGraphic, update);
              break
          }
        }
      })
    })
  }

}
