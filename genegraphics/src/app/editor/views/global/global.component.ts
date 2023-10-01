import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { FormBuilder, Validators, FormControl } from "@angular/forms";
import { GeneGraphic } from "@models/models";
import { DatabaseService } from "@services/database.service";
import { updateGeneGraphic } from "@helpers/utils";

@Component({
  selector: "editor-global",
  templateUrl: "./global.component.html",
  styleUrls: ["./global.component.scss"],
})
export class GlobalComponent implements OnInit, OnChanges {
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
      },
    ],
    showScale: [false],
    scaleSize: [1],
    laneSettings: this.fb.group({
      multilane: [true],
      overlap: [false],
      gaps: [true],
    }),
  });

  editType = "geneGraphic";
  scaleOptions = ["Hidden", "1", "5", "10"];
  scaleFormControl = new FormControl("1");

  constructor(private db: DatabaseService, private fb: FormBuilder) {}

  checkLaneSettings(values: any) {
    let newVals = values;
    if (values["multilane"] === true) {
      newVals["overlap"] = false;
      newVals["gaps"] = true;
    } else if (values["overlap"] === true) {
      newVals["gaps"] = true;
    }
    return newVals;
  }

  optionDisabled(type: string) {
    if (type === "region") return this.geneGraphic.regions.length < 1;
    else if (type === "feature") {
      return this.geneGraphic.regions.flatMap((r) => r.features).length < 1;
    } else return false;
  }

  getAllRegions() {
    return [...this.geneGraphic.regions];
  }

  getAllFeatures() {
    return [...this.geneGraphic.regions.flatMap((r) => r.features)];
  }

  ngOnInit(): void {
    for (const field in this.settingsForm.controls) {
      const formCtl = this.settingsForm.get(field);
      formCtl?.valueChanges.subscribe((selectedValue) => {
        if (formCtl.status !== "INVALID") {
          let update: { [key: string]: string } = {};
          switch (field) {
            case "width":
            case "featureHeight":
            case "showScale":
              update[field] = selectedValue;
              updateGeneGraphic(this.db, this.geneGraphic, update);
              break;
            case "laneSettings":
              update = this.checkLaneSettings(selectedValue);
              formCtl
                .get("laneSettings")
                ?.setValue(update, { emitEvent: false });
              updateGeneGraphic(this.db, this.geneGraphic, update);
              break;
          }
        }
      });
    }
    this.scaleFormControl.valueChanges.subscribe((val) => {
      let update: { [key: string]: unknown } = {};
      if (val) {
        update["scaleSize"] = val;
        if (val.toString() == "Hidden") {
          update["showScale"] = false;
        } else {
          update["showScale"] = true;
        }
        updateGeneGraphic(this.db, this.geneGraphic, update);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["geneGraphic"]) {
      this.settingsForm
        .get("width")
        ?.setValue(this.geneGraphic.width, { emitEvent: false });
      this.settingsForm
        .get("featureHeight")
        ?.setValue(this.geneGraphic.featureHeight, { emitEvent: false });
      this.settingsForm
        .get("showScale")
        ?.setValue(this.geneGraphic.showScale, { emitEvent: false });
      this.scaleFormControl?.setValue(this.geneGraphic.scaleSize.toString(), {
        emitEvent: false,
      });
      this.settingsForm
        .get("laneSettings.multilane")
        ?.setValue(this.geneGraphic.multilane, { emitEvent: false });
      this.settingsForm
        .get("laneSettings.overlap")
        ?.setValue(this.geneGraphic.overlap, { emitEvent: false });
      this.settingsForm
        .get("laneSettings.gaps")
        ?.setValue(this.geneGraphic.gaps, { emitEvent: false });
      if (this.optionDisabled("region") || this.optionDisabled("feature")) {
        this.editType = "geneGraphic";
      }
    }
  }
}
