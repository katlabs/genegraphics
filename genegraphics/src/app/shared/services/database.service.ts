import { Injectable } from "@angular/core";
import Dexie, { Table } from "dexie";
import { DataFetch, GeneGraphic, Region, Feature } from "@models/models";
import { createGeneGraphic } from "@helpers/utils";

@Injectable({
  providedIn: "root",
})
export class DatabaseService extends Dexie {
  public geneGraphics!: Table<GeneGraphic, string>;
  public dataFetches!: Table<DataFetch, string>;

  constructor() {
    super("GeneGraphicsDB");
    const db = this;

    db.version(1).stores({
      geneGraphics: "&id, opened",
      dataFetches: "&id",
    });
    db.version(2)
      .stores({
        geneGraphics: "&id, opened",
        dataFetches: "&id",
      })
      .upgrade((trans) => {
        return trans
          .table("geneGraphics")
          .toCollection()
          .modify((geneGraphic) => {
            geneGraphic.regions.forEach(
              (region: Region, region_index: number) => {
                region.features.forEach(
                  (feature: Feature, feature_index: number) => {
                    let color1 =
                      geneGraphic.regions[region_index].features[feature_index]
                        .color1;
                    let color2 =
                      geneGraphic.regions[region_index].features[feature_index]
                        .color2;
                    geneGraphic.regions[region_index].features[
                      feature_index
                    ].colors = [color1];
                    if (color2)
                      geneGraphic.regions[region_index].features[
                        feature_index
                      ].colors.push(color2);
                    delete geneGraphic.regions[region_index].features[
                      feature_index
                    ].color1;
                    if (
                      geneGraphic.regions[region_index].features[feature_index]
                        .color2
                    ) {
                      delete geneGraphic.regions[region_index].features[
                        feature_index
                      ].color2;
                    }
                  }
                );
              }
            );
          });
      });
    db.version(3)
      .stores({
        geneGraphics: "&id, opened",
        dataFetches: "&id",
      })
      .upgrade((trans) => {
        return trans
          .table("geneGraphics")
          .toCollection()
          .modify((geneGraphic) => {
            geneGraphic.scaleSize = "1";
          });
      });
    db.on("populate", () => db.populate());
  }

  async populate() {
    return await createGeneGraphic(this);
  }
}
