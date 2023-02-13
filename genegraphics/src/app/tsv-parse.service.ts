import { Injectable } from '@angular/core'
import { Papa } from 'ngx-papaparse'
import { createId } from '@paralleldrive/cuid2'
import { DatabaseService } from './database.service'
import { GeneGraphic, Region, Feature } from './models'
import {
  parseFeatureProps,
  parseRegionProps,
  applyGraphSettings,
  getIndexes,
  getFieldOrBlank,
  getHexColor,
  createGeneGraphic,
  saveImportedData,
} from './utils'

@Injectable({
  providedIn: 'root',
})
export class TsvParseService {
  constructor(private db: DatabaseService, private papa: Papa) {}

  private parseItems(
    shape: string,
    data: Array<Array<any>>,
    header: string[],
    indexes: any,
    region_pos: number
  ): Region[] {
    region_pos++
    let addRegions: Region[] = []

    data.forEach((item: any[], index: number) => {
      let get_region = addRegions.find((r: Region) => r.position === region_pos)
      const region: Region = get_region ? get_region :
        {
          id: createId(),
          name: getFieldOrBlank(item, indexes.region_name),
          nameProps: parseRegionProps(item, header),
          position: region_pos,
          size: 0,
          flipped: false,
          lanes: 1,
          lines: 0,
          Genome_ID: getFieldOrBlank(item, indexes.genome_id),
          Genome_Name: getFieldOrBlank(item, indexes.genome),
          Accession: '',
          features: []
        };
      if(!get_region) addRegions.push(region)
      let start = item[indexes.start]
      let stop = item[indexes.stop]
      let color = getHexColor(getFieldOrBlank(item, indexes.color))
      if (color == "") color = '#FFFFFF'

      let feature: Feature = {
        id: createId(),
        name: getFieldOrBlank(item, indexes.feature_name),
        nameProps: parseFeatureProps(item, header),
        start: start,
        stop: stop,
        first_bp: 0,
        last_bp: 0,
        size: Math.abs(start-stop),
        lane: 1,
        shape: shape,
        color1: color,
        BRC_ID: getFieldOrBlank(item, indexes.BRC_ID),
        Locus_Tag: '',
        Gene_Name: '',
        Gene_ID: '',
        Protein_ID: '',
        Uniprot_Acc: '',
        Product: getFieldOrBlank(item, indexes.product),
        PATRIC_Local_Family: getFieldOrBlank(item, indexes.patric_local),
        PATRIC_Global_Family: getFieldOrBlank(item, indexes.patric_global),
        Product_Length: getFieldOrBlank(item, indexes.product_length)
      }
      region.features.push(feature);
      if (
        index !== data.length - 1 &&
        item[indexes.region_change] !== data[index + 1][indexes.region_change]
      ) {
        region_pos++
      }
    })
    return addRegions
  }

  async parseAndStore(
    file: File,
    currentGeneGraphic?: GeneGraphic
  ) {
    const fileContent = await file.text()
    if (!currentGeneGraphic)
      currentGeneGraphic = await createGeneGraphic(this.db)
    if (!currentGeneGraphic) throw new Error('Could not create GeneGraphic')

    const last_region_pos = currentGeneGraphic.regions.length

    const data = this.papa.parse(fileContent, {
      header: false,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data
    let header = data.shift()
    const indexes = getIndexes(header)

    let graphSettings = applyGraphSettings(data, currentGeneGraphic)
    let graphSetShape =
      graphSettings && graphSettings['arrows'] == 'false' ? 'tag' : 'arrow'

    const addRegions: Region[] = this.parseItems(
      graphSetShape,
      data,
      header,
      indexes,
      last_region_pos
    )
    currentGeneGraphic.regions.push(...addRegions);
    return await saveImportedData(this.db, currentGeneGraphic)
  }
}
