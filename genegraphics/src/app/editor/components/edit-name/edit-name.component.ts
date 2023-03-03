import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Feature, GeneGraphic, Region } from '@models/models';
import { DatabaseService } from '@app/shared/services/database.service';
import {
  getDefaultProperty,
  updateName,
  updateNameFromField,
} from '@app/shared/helpers/utils';

@Component({
  selector: 'edit-name',
  templateUrl: './edit-name.component.html',
  styleUrls: ['./edit-name.component.scss'],
})
export class EditNameComponent implements OnChanges, OnInit {
  @Input() items!: GeneGraphic[] | Feature[] | Region[];
  @Input() geneGraphic!: GeneGraphic;
  @Input() type!: string;

  nameInput = new FormControl('');
  nameDataSel = new FormControl('');
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
  ];
  regionNameFields = ['Genome ID', 'Genome Name', 'Accession'];

  constructor(private db: DatabaseService) {}

  getTextLabel() {
    let name = '';
    if (this.type === 'feature') name = 'Feature Name';
    if (this.type === 'region') name = 'Region Name';
    if (this.type === 'geneGraphic') name = 'Image Title';
    if (this.items.length > 1) {
      name += 's';
    }
    return name;
  }

  getNameFields() {
    let fields: any[] = [];
    if (this.type === 'feature') fields = this.featureNameFields;
    else if (this.type === 'region') fields = this.regionNameFields;
    else return fields;
    return fields.filter((field) =>
      this.items.some(
        (item) => item[this.getField(field) as keyof typeof item] !== ''
      )
    );
  }

  getField(option: string) {
    return option.replace(/ /g, '_');
  }

  getFieldValue(option: string) {
    if (this.items.length === 1) {
      const field = this.getField(option) as keyof (typeof this.items)[0];
      return this.items[0][field];
    } else return ' Multiple Selected';
  }
  ngOnInit(): void {
    this.nameInput.valueChanges.subscribe((val) => {
      updateName(
        this.db,
        this.type,
        this.geneGraphic,
        this.items.map((i) => i.id),
        val || ''
      );
    });

    this.nameDataSel.valueChanges.subscribe((val) => {
      if (val)
        updateNameFromField(
          this.db,
          this.type,
          this.geneGraphic,
          this.items.map((i) => i.id),
          val
        );
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.nameInput.setValue(
        (getDefaultProperty(this.items, 'name') as string) || '',
        {
          emitEvent: false,
        }
      );
    }
  }
}
