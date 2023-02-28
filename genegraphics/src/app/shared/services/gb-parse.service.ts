import { Injectable } from '@angular/core'
import {
  GeneGraphic,
  Region,
  Feature,
} from '@models/models'
import { DatabaseService } from '@services/database.service'
import genbankParser from 'genbank-parser'
import { createGeneGraphic, DEFAULT_TEXTPROPS, saveImportedData } from '@helpers/utils'
import { createId } from '@paralleldrive/cuid2'

@Injectable({
  providedIn: 'root',
})
export class GbParseService {
  constructor(private db: DatabaseService) {}

  async parseAndStore(fileContent: string, currentGeneGraphic?: GeneGraphic) {
    if(!currentGeneGraphic)
      currentGeneGraphic = await createGeneGraphic(this.db)
    if(!currentGeneGraphic) throw new Error("Could not create GeneGraphic")

    const last_region_pos = currentGeneGraphic.regions.length
    const region_pos = last_region_pos+1
    const result = genbankParser(fileContent)[0]

    let addFeatures: Feature[] = []
    const supported_features = ['CDS', 'gene', 'mRNA']
    let addRegion: Region = {
      id: createId(),
      name: '',
      nameProps: Object.assign({}, DEFAULT_TEXTPROPS),
      position: region_pos,
      size: 0,
      flipped: false,
      lanes: 1,
      lines: 0,
      Genome_ID: '',
      Genome_Name: '',
      Accession: result.name,
      features: []
    }

    for (let feature of result.features) {
      if (feature.type === 'source') {
        addRegion.name = feature.name
        let genome_name = feature.notes['organism'][0]
        addRegion.Genome_Name = genome_name ? genome_name : ''
      } else if (supported_features.includes(feature.type)) {
        let start = feature.start
        let stop = feature.end
        if (feature.strand === -1) {
          start = feature.end
          stop = feature.start
        }
        let locus_tag = feature.notes['locus_tag']
          ? feature.notes['locus_tag'][0]
          : undefined
        let gene_name = feature.notes['gene']
          ? feature.notes['gene'][0]
          : undefined
        let db_xref = feature.notes['db_xref']
        let gene_id
        let uniprot_acc
        if (db_xref) {
          for (let ref of db_xref) {
            let ref_spl = ref.split(':')
            if (ref_spl[0] == 'GeneID') {
              gene_id = ref_spl[1]
            }
            if (ref_spl[0] == 'UniProtKB/Swiss-Prot') {
              uniprot_acc = ref_spl[1]
            }
          }
        }
        let protein_id = feature.notes['protein_id']
          ? feature.notes['protein_id'][0]
          : undefined
        let product = feature.notes['product']
          ? feature.notes['product'][0]
          : undefined

        let feature_match = addFeatures.find((f: Feature) => {
          return f.start == start && f.stop == stop
        })
        if (feature_match) {
          feature_match.Locus_Tag = feature_match.Locus_Tag
            ? feature_match.Locus_Tag
            : locus_tag || ''
          feature_match.Gene_Name = feature_match.Gene_Name
            ? feature_match.Gene_Name
            : gene_name || ''
          feature_match.Gene_ID = feature_match.Gene_ID
            ? feature_match.Gene_ID
            : gene_id || ''
          feature_match.Protein_ID = feature_match.Protein_ID
            ? feature_match.Protein_ID
            : protein_id || ''
          feature_match.Product = feature_match.Product
            ? feature_match.Product
            : product || ''
          feature_match.Uniprot_Acc = feature_match.Uniprot_Acc
            ? feature_match.Uniprot_Acc
            : uniprot_acc || ''
        } else {
          addFeatures.push({
            id: createId(),
            name: '',
            nameProps: Object.assign({}, DEFAULT_TEXTPROPS),
            start: start,
            stop: stop,
            first_bp: 0,
            last_bp: 0,
            size: Math.abs(stop-start),
            lane: 1,
            shape: 'arrow',
            color1: '#FFFFFF',
            BRC_ID: '',
            Locus_Tag: locus_tag || '',
            Gene_Name: gene_name || '',
            Gene_ID: gene_id || '',
            Protein_ID: protein_id || '',
            Uniprot_Acc: uniprot_acc || '',
            Product: product || '',
            PATRIC_Local_Family: '',
            PATRIC_Global_Family: '',
            Product_Length: '',
          })
        }
      }
    }
    if (addFeatures.length == 0) {
      throw new Error('Unable to parse file.')
    }

    addRegion.features.push(...addFeatures);
    currentGeneGraphic.regions.push(addRegion);
    return await saveImportedData(this.db, currentGeneGraphic);
  }
}
