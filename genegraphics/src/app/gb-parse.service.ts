import { Injectable } from '@angular/core';
import { DatabaseService, GeneGraphic, Region, Feature, TextProps } from './database.service';
import genbankParser  from 'genbank-parser';

@Injectable({
  providedIn: 'root'
})
export class GbParseService {

  constructor(private db: DatabaseService ) { }

  async parseAndStore(fileContent: string, newSession: boolean){
    const geneGraphicId = await this.db.getOrCreateGeneGraphic(newSession);
    let last_region_id = await this.db.getLastRegionId();
    const region_id: number = last_region_id ? last_region_id+1 : 1;
    let last_region_pos = await this.db.getLastRegionPosition(geneGraphicId);
    const region_pos = last_region_pos ? last_region_pos+1: 1;
    const result = genbankParser(fileContent)[0];
    console.log(result);
    let addFeatures: Feature[] = [];
    const supported_features = ["CDS", "gene", "mRNA"];
    let addRegion: Region = {
      id: region_id,
      geneGraphicId: geneGraphicId,
      name: "",
      nameProps: this.db.makeNewTextProps(),
      position: region_pos,
      lanes: 1,
      size: 0,
      start: 0,
      stop: 0,
      Genome_ID: "",
      Genome_Name: "",
      Accession: result.name,
    }

    for (let feature of result.features){
      if (feature.type === "source"){
        addRegion.name = feature.name;
        addRegion.start = feature.start;
        addRegion.stop = feature.end;
        addRegion.size = feature.end-feature.start+1;
        let genome_name = feature.notes["organism"][0];
        addRegion.Genome_Name = genome_name ? genome_name : "";

      } else if (supported_features.includes(feature.type)){
        let start = feature.start;
        let stop = feature.end;
        if(feature.strand===-1){
          start = feature.end;
          stop = feature.start;
        }
        let length = feature.end-feature.start;
        let lane = 1;
        let locus_tag = feature.notes["locus_tag"] ? feature.notes["locus_tag"][0] : undefined;
        let gene_name = feature.notes["gene"] ? feature.notes["gene"][0] : undefined;
        let db_xref = feature.notes["db_xref"];
        let gene_id;
        let uniprot_acc;
        if (db_xref){
          for (let ref of db_xref){
            let ref_spl = ref.split(":");
            if (ref_spl[0] == "GeneID"){
              gene_id = ref_spl[1];
            }
            if (ref_spl[0] == "UniProtKB/Swiss-Prot"){
              uniprot_acc = ref_spl[1];
            }
          }
        }
        let protein_id = feature.notes["protein_id"] ? feature.notes["protein_id"][0] : undefined;
        let product = feature.notes["product"] ? feature.notes["product"][0] : undefined;

        let prev_feat = addFeatures.at(-1);
        if ( prev_feat && prev_feat.stop > feature.start && prev_feat.lane !=2 ){
          lane = 2;
          addRegion.lanes = 2;
        }
        let feature_match = addFeatures.find((f:Feature)=>{
          return (f.start == start  && f.stop == stop);
        })
        if (feature_match){
          feature_match.Locus_Tag = feature_match.Locus_Tag ? feature_match.Locus_Tag : locus_tag || "";
          feature_match.Gene_Name = feature_match.Gene_Name ? feature_match.Gene_Name : gene_name || "";
          feature_match.Gene_ID = feature_match.Gene_ID ? feature_match.Gene_ID : gene_id || "";
          feature_match.Protein_ID = feature_match.Protein_ID ? feature_match.Protein_ID : protein_id || "";
          feature_match.Product = feature_match.Product ? feature_match.Product : product || "";
          feature_match.Uniprot_Acc = feature_match.Uniprot_Acc ? feature_match.Uniprot_Acc : uniprot_acc || "";
        } else {
          addFeatures.push({
            regionId: region_id,
            name: "",
            nameProps: this.db.makeNewTextProps(),
            start: start,
            stop: stop,
            length: length,
            shape: "arrow",
            color1: "#FFFFFF",
            lane: lane,
            BRC_ID: "",
            Locus_Tag: locus_tag || "",
            Gene_Name: gene_name || "",
            Gene_ID: gene_id || "",
            Protein_ID: protein_id || "",
            Product: product || "",
            Uniprot_Acc: uniprot_acc || "",
            PATRIC_Local_Family: "",
            PATRIC_Global_Family: "",
            Product_Length: ""
          })
        }
      }
    }
    if (addFeatures.length == 0){
      throw new Error("Unable to parse file.");
    }
    this.db.transaction("rw", this.db.geneGraphics, this.db.regions, this.db.features, ()=>{
      this.db.regions.add(addRegion);
      this.db.features.bulkAdd(addFeatures);
    })
  }

}
