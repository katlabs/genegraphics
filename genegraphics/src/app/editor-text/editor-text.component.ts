import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core'
import { FormBuilder } from '@angular/forms'
import { DatabaseService } from '../database.service'
import { Feature, GeneGraphic, Region } from '../models'
import {
  getDefaultProperty,
  DEFAULT_TEXTPROPS,
  updateTextProps,
  updateName,
  updateNameFromField,
} from '../utils'

@Component({
  selector: 'app-editor-text',
  templateUrl: './editor-text.component.html',
  styleUrls: ['./editor-text.component.scss'],
})
export class EditorTextComponent implements OnChanges, OnInit {
  @Input() items!: GeneGraphic[] | Feature[] | Region[]
  @Input() geneGraphic!: GeneGraphic
  @Input() type!: string
  textPropsForm = this.fb.group({
    name: this.fb.group({
      nameInput: [''],
      nameAs: [''],
    }),
    boldItalicHide: [this.getDefaultBoldItalicHide()],
    fontSize: [DEFAULT_TEXTPROPS.fontSize],
    fontFamily: [DEFAULT_TEXTPROPS.fontFamily],
    color: [DEFAULT_TEXTPROPS.color],
    posHor: [DEFAULT_TEXTPROPS.posHor],
    posVert: [DEFAULT_TEXTPROPS.posVert],
  })

  featureNameFields = [
    'BRC ID',
    'Locus Tag',
    'Gene Name',
    'Gene ID',
    'Protein ID',
    'Uniprot Acc',
    'Product',
    'PATRIC Local Family',
    'PATRIC Global Family',
  ]
  regionNameFields = ['Genome ID', 'Genome Name', 'Accession']

  fontFamilies = [
    'Arial, sans-serif',
    'Open sans, sans-serif',
    'Roboto, sans-serif',
    'Times, Times New Roman, serif',
    'Computer Modern Sans, sans-serif',
    'Computer Modern Serif, serif',
    'Roboto Mono, monospace',
    'Source Code Pro, monospace',
  ]

  constructor(private fb: FormBuilder, private db: DatabaseService) {}

  getTextLabel() {
    let name = ''
    if (this.type === 'feature') name = 'Feature Name'
    if (this.type === 'region') name = 'Region Name'
    if (this.type === 'geneGraphic') name = 'Image Title'
    if (this.items.length > 1) {
      name += 's'
    }
    return name
  }

  disablePosVert() {
    return this.type !== 'feature'
  }

  getNameFields() {
    let fields: any[] = [];
    if (this.type === 'feature') fields = this.featureNameFields
    else if (this.type === 'region') fields = this.regionNameFields
    else return fields;
    return fields.filter((field) =>this.items.some((item) => item[this.getField(field) as keyof typeof item] !== ''))
  }

  getField(option: string) {
    return option.replace(/ /g, '_')
  }

  getFieldValue(option: string) {
    if (this.items.length === 1) {
      const field = this.getField(option) as keyof (typeof this.items)[0]
      return this.items[0][field]
    } else return ' Multiple Selected';
  }

  getDefaultBoldItalicHide() {
    let arr = [] as string[]
    if (this.items) {
      if (getDefaultProperty(this.items, 'bold') as boolean) arr.push('bold')
      if (getDefaultProperty(this.items, 'italic') as boolean)
        arr.push('italic')
      if (getDefaultProperty(this.items, 'hide') as boolean) arr.push('hide')
    } else {
      if (DEFAULT_TEXTPROPS.bold) arr.push('bold')
      if (DEFAULT_TEXTPROPS.italic) arr.push('italic')
      if (DEFAULT_TEXTPROPS.hide) arr.push('hide')
    }
    return arr
  }

  getVisibleIcon(){
    if(this.textPropsForm.get('boldItalicHide')?.value?.includes('hide')){
      return 'visibility_off';
    } else return 'visibility';
  }

  ngOnInit(): void {
    for (const field in this.textPropsForm.controls) {
      const control = this.textPropsForm.get(field)
      control?.valueChanges.subscribe((val) => {
        if (field === 'boldItalicHide') {
          let newVals: Record<string, any> = {}
          newVals['bold'] = val?.includes('bold') ? true : false
          newVals['italic'] = val?.includes('italic') ? true : false
          newVals['hide'] = val?.includes('hide') ? true : false
          updateTextProps(
            this.db,
            this.type,
            this.geneGraphic,
            this.items.map((i) => i.id),
            newVals
          )
        } else if (field !== 'name') {
          let newVals: Record<string, any> = {}
          newVals[field] = val
          updateTextProps(
            this.db,
            this.type,
            this.geneGraphic,
            this.items.map((i) => i.id),
            newVals
          )
        }
      })
    }
    this.textPropsForm.get('name.nameInput')?.valueChanges.subscribe((val) => {
      if (val)
        updateName(
          this.db,
          this.type,
          this.geneGraphic,
          this.items.map((i) => i.id),
          val
        )
    })
    this.textPropsForm.get('name.nameAs')?.valueChanges.subscribe((val) => {
      console.log(this.geneGraphic)
      if (val)
        updateNameFromField(
          this.db,
          this.type,
          this.geneGraphic,
          this.items.map((i) => i.id),
          val
        )
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.textPropsForm
        .get('name.nameInput')
        ?.setValue(getDefaultProperty(this.items, 'name') as string || '', {emitEvent: false})
      this.textPropsForm
        .get('boldItalicHide')
        ?.setValue(this.getDefaultBoldItalicHide() || [], {emitEvent:false})
      this.textPropsForm
        .get('fontSize')
        ?.setValue(getDefaultProperty(this.items, 'fontSize') as number || DEFAULT_TEXTPROPS.fontSize, {emitEvent:false})
      this.textPropsForm
        .get('fontFamily')
        ?.setValue(getDefaultProperty(this.items, 'fontFamily') as string || DEFAULT_TEXTPROPS.fontFamily, {emitEvent:false})
      this.textPropsForm
        .get('color')
        ?.setValue(getDefaultProperty(this.items, 'color') as string || DEFAULT_TEXTPROPS.color, {emitEvent:false})
      this.textPropsForm
        .get('posHor')
        ?.setValue(getDefaultProperty(this.items, 'posHor') as string || DEFAULT_TEXTPROPS.posHor, {emitEvent:false})
      this.textPropsForm
        .get('posVert')
        ?.setValue(getDefaultProperty(this.items, 'posVert') as string || DEFAULT_TEXTPROPS.posVert, {emitEvent:false})
    }
  }
}
