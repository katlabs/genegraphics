import { Component, Input, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { getDataFetchesObservable, tooltipDefaults } from "@helpers/utils";
import { DatabaseService } from "@services/database.service";
import { GeneGraphic, NCBIGenome } from "@models/models";
import { Observable, startWith, map, first } from "rxjs";
import { NcbiFetchService } from "@services/ncbi-fetch.service";
import { GbParseService } from "@services/gb-parse.service";
import { MAT_TOOLTIP_DEFAULT_OPTIONS } from "@angular/material/tooltip";

@Component({
  selector: "app-ncbi-fetch",
  templateUrl: "./ncbi-fetch.component.html",
  styleUrls: ["./ncbi-fetch.component.scss"],
  providers: [
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: tooltipDefaults },
  ],
})
export class NcbiFetchComponent implements OnInit {
  @Input() geneGraphic!: GeneGraphic;
  filteredGenomes: Observable<NCBIGenome[]> | undefined;
  options: NCBIGenome[] = [];
  loading: boolean = false;
  error_msg: string | null = null;
  searchTypeCtrl = new FormControl();
  ncbiForm = new FormGroup({
    organismCtrl: new FormControl(),
    identifierCtrl: new FormControl(),
    regionSizeCtrl: new FormControl(5000, {
      validators: [Validators.required, Validators.min(0)],
    }),
    regionStartCtrl: new FormControl(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
    regionEndCtrl: new FormControl(5000, {
      validators: [Validators.required, Validators.min(0)],
    }),
  });
  searchOptions = [
    "Gene ID",
    "Protein ID",
    "UniprotKB Accession",
    "Gene Symbol and Genome",
    "Genome Region",
  ];

  constructor(
    private db: DatabaseService,
    private ncbiFetch: NcbiFetchService,
    private gbParse: GbParseService
  ) {}

  private _filter(value: string): NCBIGenome[] {
    if (value && this.options && typeof value === "string") {
      const filterValue = value.toLowerCase();
      return this.options
        .filter(
          (option) =>
            option.organism &&
            option.organism.toLowerCase().includes(filterValue)
        )
        .slice(0, 10);
    } else return [] as NCBIGenome[];
  }

  displayFn(genome: NCBIGenome) {
    if (genome) return genome.organism;
    else return "";
  }

  useRegionSize(type: number) {
    if (type == null) return false;
    else if (type <= 3) return true;
    else return false;
  }

  getIdentifierPlaceholder(type: number) {
    if (type === 0) return "Example: 5325574";
    else if (type === 1) return "Example: ABR55064.1";
    else if (type === 2) return "Example: A6URE2";
    else if (type === 3) return "Example: comB";
    else return "";
  }

  getIdentifierLabel(type: number) {
    if (type === 0) return "Gene ID";
    else if (type === 1) return "Protein ID";
    else if (type === 2) return "UniprotKB Accession";
    else if (type === 3) return "Gene Name/Symbol";
    else return null;
  }

  fetchFromNcbi() {
    const type = this.searchTypeCtrl.value;
    const type_str = this.searchOptions[type];
    const identifier = this.ncbiForm.get("identifierCtrl")?.value;
    const organism = this.ncbiForm.get("organismCtrl")?.value;
    const regStart = this.ncbiForm.get("regionStartCtrl")?.value;
    const regEnd = this.ncbiForm.get("regionEndCtrl")?.value;
    const regSize = this.ncbiForm.get("regionSizeCtrl")?.value;
    let term;
    if (type < 3 && identifier) {
      term = identifier;
    } else if (type === 3 && identifier && organism.gbId) {
      term = `(${organism.gbId}[Nucleotide Accession]) AND ${identifier}[Gene Name]`;
    } else if (type === 4 && organism.gbId) {
      term = organism.gbId;
    } else {
      term = null;
    }
    let regArr: [number, number] = [0, 0];
    console.log(regStart);
    if (type === 4 && (regStart || regStart === 0) && (regEnd || regEnd === 0))
      regArr = [regStart, regEnd];
    else if (regSize) regArr = [0, regSize];
    else throw new Error("No region start/end/size");
    if (term) {
      this.loading = true;
      this.ncbiFetch
        .getGBFile(type_str, term, regArr)
        .pipe(first())
        .subscribe({
          next: (gbText) => {
            this.loading = false;
            this.gbParse.parseAndStore(gbText, this.geneGraphic, type_str);
          },
          error: (error) => {
            this.loading = false;
            this.searchTypeCtrl.reset();
            this.ncbiForm.reset({
              regionSizeCtrl: 5000,
              regionStartCtrl: 0,
              regionEndCtrl: 5000,
            });
            this.error_msg =
              "The query did not retrieve results. Please try again.";
          },
        });
    }
  }

  ngOnInit(): void {
    getDataFetchesObservable(this.db).subscribe((fetches) => {
      if (fetches.length > 0) {
        fetches.sort((a, b) => (a.last_fetch < b.last_fetch ? 1 : -1));
        this.options = fetches[0].data;
      }
    });
    this.filteredGenomes = this.ncbiForm.get("organismCtrl")?.valueChanges.pipe(
      startWith(""),
      map((value) => this._filter(value || ""))
    );
    this.searchTypeCtrl.valueChanges.subscribe(() => {
      if (this.error_msg) {
        this.error_msg = null;
      }
      this.ncbiForm.reset({
        regionSizeCtrl: 5000,
        regionStartCtrl: 0,
        regionEndCtrl: 5000,
      });
    });
  }
}
