import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { DatabaseService } from '@services/database.service';
import { Feature, GeneGraphic, Region } from '@models/models';
import {
  getDefaultProperty,
  DEFAULT_TEXTPROPS,
  updateTextProps,
  updateName,
  updateNameFromField,
} from '@helpers/utils';

@Component({
  selector: 'edit-text-props',
  templateUrl: './edit-text-props.component.html',
  styleUrls: ['./edit-text-props.component.scss'],
})
export class EditTextPropsComponent implements OnChanges, OnInit {
  @Input() items!: GeneGraphic[] | Feature[] | Region[];
  @Input() geneGraphic!: GeneGraphic;
  @Input() type!: string;
  boldItalicHide = new FormControl(this.getDefaultBoldItalicHide());
  fontSize = new FormControl(DEFAULT_TEXTPROPS.fontSize, [
    Validators.min(6),
    Validators.max(60),
  ]);
  fontFamily = new FormControl(DEFAULT_TEXTPROPS.fontFamily);
  color = new FormControl(DEFAULT_TEXTPROPS.color);
  posHor = new FormControl(DEFAULT_TEXTPROPS.posHor);
  posVert = new FormControl(DEFAULT_TEXTPROPS.posVert);

  fontFamilies = [
    'Arial, sans-serif',
    'Open sans, sans-serif',
    'Roboto, sans-serif',
    'Times, Times New Roman, serif',
    'Computer Modern Sans, sans-serif',
    'Computer Modern Serif, serif',
    'Roboto Mono, monospace',
    'Source Code Pro, monospace',
  ];

  constructor(private fb: FormBuilder, private db: DatabaseService) {}

  disablePosVert() {
    return this.type !== 'feature';
  }

  getDefaultBoldItalicHide() {
    let arr = [] as string[];
    if (this.items) {
      if (getDefaultProperty(this.items, 'bold') as boolean) arr.push('bold');
      if (getDefaultProperty(this.items, 'italic') as boolean)
        arr.push('italic');
      if (getDefaultProperty(this.items, 'hide') as boolean) arr.push('hide');
    } else {
      if (DEFAULT_TEXTPROPS.bold) arr.push('bold');
      if (DEFAULT_TEXTPROPS.italic) arr.push('italic');
      if (DEFAULT_TEXTPROPS.hide) arr.push('hide');
    }
    return arr;
  }

  getVisibleIcon() {
    if (this.boldItalicHide.value?.includes('hide')) {
      return 'visibility_off';
    } else return 'visibility';
  }

  getFontFamButtonText() {
    const family = this.fontFamily.value?.split(', ')[0];
    if (family) {
      return family;
    } else {
      return 'Font Family';
    }
  }

  ngOnInit(): void {
    this.boldItalicHide.valueChanges.subscribe((val) => {
      let newVals: Record<string, any> = {};
      newVals['bold'] = val?.includes('bold') ? true : false;
      newVals['italic'] = val?.includes('italic') ? true : false;
      newVals['hide'] = val?.includes('hide') ? true : false;
      updateTextProps(
        this.db,
        this.type,
        this.geneGraphic,
        this.items.map((i) => i.id),
        newVals
      );
    });
    this.fontFamily.valueChanges.subscribe((val) => {
      updateTextProps(
        this.db,
        this.type,
        this.geneGraphic,
        this.items.map((i) => i.id),
        { fontFamily: val }
      );
    });
    this.fontSize.valueChanges.subscribe((val) => {
      updateTextProps(
        this.db,
        this.type,
        this.geneGraphic,
        this.items.map((i) => i.id),
        { fontSize: val }
      );
    });
    this.color.valueChanges.subscribe((val) => {
      updateTextProps(
        this.db,
        this.type,
        this.geneGraphic,
        this.items.map((i) => i.id),
        { color: val }
      );
    });
    this.posHor.valueChanges.subscribe((val) => {
      updateTextProps(
        this.db,
        this.type,
        this.geneGraphic,
        this.items.map((i) => i.id),
        { posHor: val }
      );
    });
    this.posVert.valueChanges.subscribe((val) => {
      updateTextProps(
        this.db,
        this.type,
        this.geneGraphic,
        this.items.map((i) => i.id),
        { posVert: val }
      );
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.boldItalicHide.setValue(this.getDefaultBoldItalicHide() || [], {
        emitEvent: false,
      });
      this.fontSize.setValue(
        (getDefaultProperty(this.items, 'fontSize') as number) ||
          DEFAULT_TEXTPROPS.fontSize,
        { emitEvent: false }
      );
      this.fontFamily.setValue(
        (getDefaultProperty(this.items, 'fontFamily') as string) ||
          DEFAULT_TEXTPROPS.fontFamily,
        { emitEvent: false }
      );
      this.color.setValue(
        (getDefaultProperty(this.items, 'color') as string) ||
          DEFAULT_TEXTPROPS.color,
        { emitEvent: false }
      );
      this.posHor.setValue(
        (getDefaultProperty(this.items, 'posHor') as string) ||
          DEFAULT_TEXTPROPS.posHor,
        { emitEvent: false }
      );
      this.posVert.setValue(
        (getDefaultProperty(this.items, 'posVert') as string) ||
          DEFAULT_TEXTPROPS.posVert,
        { emitEvent: false }
      );
    }
  }
}
