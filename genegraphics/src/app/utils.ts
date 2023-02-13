import { GeneGraphic, Region, Feature, TextProps, Selection } from './models'
import { DatabaseService } from './database.service'
import { createId } from '@paralleldrive/cuid2'
import { liveQuery } from 'dexie'

export const DEFAULT_TEXTPROPS = {
  hide: false,
  bold: false,
  italic: false,
  fontSize: 16,
  fontFamily: 'Arial, sans-serif',
  color: '#000000',
  posHor: 'left',
  posVert: 'above',
}

export function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  let interval = Math.floor(seconds / 31536000)
  if (interval > 1) {
    return interval + ' years ago'
  }
  interval = Math.floor(seconds / 2592000)
  if (interval > 1) {
    return interval + ' months ago'
  }
  interval = Math.floor(seconds / 86400)
  if (interval > 1) {
    return interval + ' days ago'
  }
  interval = Math.floor(seconds / 3600)
  if (interval > 1) {
    return interval + ' hours ago'
  }
  interval = Math.floor(seconds / 60)
  if (interval > 1) {
    return interval + ' minutes ago'
  }
  if (seconds < 10) return 'just now'

  return Math.floor(seconds) + ' seconds ago'
}

export async function changeRegionPosition(
  db: DatabaseService,
  region: Region,
  geneGraphic: GeneGraphic,
  dir: string
) {
  const curr_pos = region.position
  let curr_pos_ind = geneGraphic.regions
    .map((r) => r.position)
    .indexOf(curr_pos)
  if (dir === 'down') {
    let next_pos_ind = geneGraphic.regions
      .map((r) => r.position)
      .indexOf(curr_pos + 1)
    geneGraphic.regions[curr_pos_ind].position = curr_pos + 1
    geneGraphic.regions[next_pos_ind].position = curr_pos
  } else if (dir === 'up') {
    let prev_pos_ind = geneGraphic.regions
      .map((r) => r.position)
      .indexOf(curr_pos - 1)
    geneGraphic.regions[curr_pos_ind].position = curr_pos - 1
    geneGraphic.regions[prev_pos_ind].position = curr_pos
  }
  return await db.transaction('rw', db.geneGraphics, async () => {
    await db.geneGraphics.put(geneGraphic)
    return geneGraphic.regions[curr_pos_ind].position
  })
}

export function getCurrentGeneGraphic(db: DatabaseService) {
  return liveQuery(() => db.geneGraphics.orderBy('opened').last())
}

export async function getDataFetches(db: DatabaseService) {
  return await db.dataFetches.toArray();
}

export function getDataFetchesObservable(db: DatabaseService){
  return liveQuery(()=> db.dataFetches.toArray())
}

export async function saveSelection(
  db: DatabaseService,
  geneGraphic: GeneGraphic,
  selection: Selection
) {
  geneGraphic.selections.push(selection)
  return await db.geneGraphics.put(geneGraphic)
}

export async function deleteSelection(
  db: DatabaseService,
  geneGraphic: GeneGraphic,
  selection: Selection
) {
  let newSelections: Selection[] = []
  geneGraphic.selections.forEach((sel) => {
    if (selectionsEqual(sel, selection)) newSelections.push(sel)
  })
  geneGraphic.selections = newSelections
  return await db.geneGraphics.put(geneGraphic)
}

export async function createGeneGraphic(db: DatabaseService) {
  const window_width = window.innerWidth;
  const newGeneGraphic: GeneGraphic = {
    id: createId(),
    name: 'New Gene Graphic',
    nameProps: Object.assign({}, DEFAULT_TEXTPROPS),
    opened: Date.now(),
    width: window_width-40,
    featureHeight: 50,
    showScale: true,
    scale_ratio: 0.2,
    multilane: true,
    gaps: false,
    overlap: false,
    regions: [] as Region[],
    selections: [] as Selection[],
  }
  return await db.transaction('rw', db.geneGraphics, async () => {
    const new_id = await db.geneGraphics.add(newGeneGraphic)
    return await db.geneGraphics.get(new_id)
  })
}

export async function deleteGeneGraphic(
  db: DatabaseService,
  geneGraphic: GeneGraphic
) {
  await db.transaction('rw', db.geneGraphics, async () => {
    await db.geneGraphics.where({ id: geneGraphic.id }).delete()
    const geneGraphics = await db.geneGraphics.toArray()
    if (geneGraphics.length < 1) {
      await createGeneGraphic(db)
    }
  })
}

export async function updateGeneGraphic(
  db: DatabaseService,
  geneGraphic: GeneGraphic,
  update: { [key: string]: string }
) {
  Object.assign(geneGraphic, update)
  const updateScaleOn = ['width']
  const updateShiftsOn = ['multilane', 'overlap', 'gaps']
  if (Object.keys(update).some((r) => updateShiftsOn.indexOf(r) >= 0)) {
    applyShifts(geneGraphic)
  } else if (Object.keys(update).some((r) => updateScaleOn.indexOf(r) >= 0)) {
    updateScaleRatio(geneGraphic)
  }
  await db.geneGraphics.put(geneGraphic)
}

export async function updateGeneGraphicTitleProps(
  db: DatabaseService,
  geneGraphic: GeneGraphic,
  update: { [key: string]: string }
) {
  if (geneGraphic.id) await db.geneGraphics.update(geneGraphic.id, update)
}

export function deleteFeatures(
  db: DatabaseService,
  geneGraphic: GeneGraphic,
  ids: string[]
) {
  geneGraphic.regions.forEach((region) => {
    let newFeatures: Feature[] = []
    region.features.forEach((feature) => {
      if (!ids.includes(feature.id)) newFeatures.push(feature)
    })
    region.features = newFeatures
  })
  applyShifts(geneGraphic)
  db.geneGraphics.put(geneGraphic)
}

export function deleteRegions(
  db: DatabaseService,
  geneGraphic: GeneGraphic,
  ids: string[]
) {
  let newRegions: Region[] = []
  geneGraphic.regions.forEach((region) => {
    if (!ids.includes(region.id)) newRegions.push(region)
  })
  geneGraphic.regions = newRegions
  geneGraphic.regions
    .sort((r1, r2) => r1.position - r2.position)
    .forEach((r, i) => (r.position = i + 1))
  updateScaleRatio(geneGraphic)
  db.geneGraphics.put(geneGraphic)
}

export function updateRegionLines(
  db: DatabaseService,
  geneGraphic: GeneGraphic,
  ids: string[],
  value: number
) {
  geneGraphic.regions.forEach((region) => {
    if (ids.includes(region.id)) region.lines = value
  })
  db.geneGraphics.put(geneGraphic)
}

export function applyShifts(geneGraphic: GeneGraphic) {
  geneGraphic.regions.forEach((region) => {
    const region_start = Math.min(
      region.features[0].start,
      region.features[0].stop
    )
    region.features.forEach((feature, i, arr) => {
      if (i === 0) {
        feature.first_bp = 0
        feature.last_bp = feature.size
        feature.lane = 1
      } else {
        const curr_first = Math.min(feature.start, feature.stop)
        const curr_last = Math.max(feature.start, feature.stop)
        const prev_last = Math.max(arr[i - 1].start, arr[i - 1].stop)
        if (geneGraphic.multilane) {
          //No feature shifting, lane shifting.
          feature.first_bp = curr_first - region_start
          feature.last_bp = curr_last - region_start
          // Move to lane 2 if overlap & prev was not moved.
          if (curr_first < prev_last && arr[i - 1].lane !== 2) feature.lane = 2
          else feature.lane = 1
        } else if (geneGraphic.overlap) {
          //No feature shifting, no lane shifting.
          feature.first_bp = curr_first - region_start
          feature.last_bp = curr_last - region_start
          feature.lane = 1
        } else if (geneGraphic.gaps) {
          // Features shift, no lane shifting, keep gaps
          if (curr_first < prev_last) {
            // Features overlap
            feature.first_bp = arr[i - 1].last_bp + 1
            feature.last_bp = feature.first_bp + feature.size
            feature.lane = 1
          } else {
            //Keep any gaps
            feature.first_bp = arr[i - 1].last_bp + (curr_first - prev_last) + 1
            feature.last_bp = feature.first_bp + feature.size
            feature.lane = 1
          }
        } else {
          // Features shift, no lane shifting, remove gaps.
          feature.first_bp = arr[i - 1].last_bp + 1
          feature.last_bp = feature.first_bp + feature.size
          feature.lane = 1
        }
      }
    })
    const len = region.features.length
    if (len !== 0) {
      region.size =
        region.features[len - 1].last_bp - region.features[0].first_bp
    } else {
      region.size = 0
    }
    if (region.features.some((f) => f.lane === 2)) region.lanes = 2
    else region.lanes = 1
    if (!geneGraphic.multilane && region.lines === 2) region.lines = 1
  })
  flipRegions(geneGraphic)
  updateScaleRatio(geneGraphic)
}

export function flipRegions(geneGraphic: GeneGraphic) {
  //const end = Math.max(...geneGraphic.regions.map(r=>r.size));
  geneGraphic.regions.forEach((region) => {
    if (region.flipped) {
      const end = region.size
      region.features.forEach((f) => {
        const orig_first = f.first_bp
        const orig_last = f.last_bp
        f.first_bp = end - orig_last
        f.last_bp = end - orig_first
      })
    }
  })
}

export function flipRegionsAndUpdate(
  db: DatabaseService,
  geneGraphic: GeneGraphic,
  region_ids: string[],
  flip: boolean
) {
  geneGraphic.regions.forEach((region) => {
    if (region_ids.includes(region.id)) region.flipped = flip
  })
  applyShifts(geneGraphic)
  db.geneGraphics.put(geneGraphic)
}

export function updateScaleRatio(geneGraphic: GeneGraphic) {
  const max_region_size = Math.max(...geneGraphic.regions.map((r) => r.size))
  if (geneGraphic.regions.length > 0 && max_region_size !== 0) {
    geneGraphic.scale_ratio = geneGraphic.width / max_region_size
  } else {
    // Default scale if there are no regions
    geneGraphic.scale_ratio = 0.2
  }
}

export async function saveImportedData(
  db: DatabaseService,
  geneGraphic: GeneGraphic
) {
  applyShifts(geneGraphic)
  return await db.geneGraphics.put(geneGraphic)
}
export function selectionsEqual(sel1: Selection, sel2: Selection) {
  const sel1_set = [...new Set(sel1.ids_list).values()]
  const sel2_set = [...new Set(sel2.ids_list).values()]
  return sel1_set.length != sel2_set.length
    ? false
    : sel1_set.every((x) => sel2_set.includes(x))
}

export function getDefaultProperty(
  items: GeneGraphic[] | Region[] | Feature[],
  property: string
) {
  if (property in items[0]) {
    const key = property as keyof (typeof items)[0]
    return items.map((i) => i).every((a, _, [b]) => a[key] === b[key])
      ? items[0][key]
      : null
  } else if (property in items[0].nameProps) {
    const key = property as keyof TextProps
    return items.map((i) => i.nameProps).every((a, _, [b]) => a[key] === b[key])
      ? items[0].nameProps[key]
      : DEFAULT_TEXTPROPS[key]
  } else {
    return null
  }
}

export function updateTextProp(
  item: GeneGraphic | Region | Feature,
  field: string,
  newVal: any
) {
  switch (field) {
    case 'hide':
      item.nameProps.hide = newVal
      break
    case 'bold':
      item.nameProps.bold = newVal
      break
    case 'italic':
      item.nameProps.italic = newVal
      break
    case 'fontSize':
      item.nameProps.fontSize = newVal
      break
    case 'fontFamily':
      item.nameProps.fontFamily = newVal
      break
    case 'color':
      item.nameProps.color = newVal
      break
    case 'posHor':
      item.nameProps.posHor = newVal
      break
    case 'posVert':
      item.nameProps.posVert = newVal
  }
}

export function updateTextProps(
  db: DatabaseService,
  type: string,
  geneGraphic: GeneGraphic,
  ids: any[],
  newVals: Record<string, any>
) {
  if (type === 'geneGraphic') {
    for (const key in newVals) {
      updateTextProp(geneGraphic, key, newVals[key])
    }
  } else {
    geneGraphic.regions.forEach((region) => {
      if (type === 'region' && ids.includes(region.id)) {
        for (const key in newVals) {
          updateTextProp(region, key, newVals[key])
        }
      } else if (type === 'feature') {
        region.features.forEach((feature) => {
          if (ids.includes(feature.id)) {
            for (const key in newVals) {
              updateTextProp(feature, key, newVals[key])
            }
          }
        })
      }
    })
  }
  db.geneGraphics.put(geneGraphic)
}

export function updateName(
  db: DatabaseService,
  type: string,
  geneGraphic: GeneGraphic,
  ids: any[],
  newName: string
) {
  if (type === 'geneGraphic') geneGraphic.name = newName
  else {
    geneGraphic.regions.forEach((region) => {
      if (type === 'region' && ids.includes(region.id)) {
        region.name = newName
      } else if (type === 'feature') {
        region.features.forEach((feature) => {
          if (ids.includes(feature.id)) feature.name = newName
        })
      }
    })
  }
  db.geneGraphics.put(geneGraphic)
}

export function updateNameFromField(
  db: DatabaseService,
  type: string,
  geneGraphic: GeneGraphic,
  ids: any[],
  field: string
) {
  geneGraphic.regions.forEach((region) => {
    if (type === 'region' && ids.includes(region.id)) {
      const newName = region[field as keyof typeof region] as string
      region.name = newName
    } else if (type === 'feature') {
      region.features.forEach((feature) => {
        if (ids.includes(feature.id)) {
          const newName = feature[field as keyof typeof feature] as string
          feature.name = newName
        }
      })
    }
  })
  db.geneGraphics.put(geneGraphic)
}

export function updateFeatureShapes(
  db: DatabaseService,
  geneGraphic: GeneGraphic,
  ids: string[],
  newShape: string
) {
  geneGraphic.regions.forEach((region) => {
    region.features.forEach((feature) => {
      if (ids.includes(feature.id)) feature.shape = newShape
    })
  })
  db.geneGraphics.put(geneGraphic)
}

export function updateFeatureColors(
  db: DatabaseService,
  geneGraphic: GeneGraphic,
  ids: string[],
  color1: string,
  color2: string | null
) {
  geneGraphic.regions.forEach((region) => {
    region.features.forEach((feature) => {
      if (ids.includes(feature.id)) {
        feature.color1 = color1
        feature.color2 = color2
      }
    })
  })
  return db.geneGraphics.put(geneGraphic)
}

export function parseBool(s: string) {
  return s.toLowerCase() == 'true'
    ? true
    : s.toLowerCase() == 'false'
    ? false
    : undefined
}

export function getHexColor(str: string): string {
  if (str === '') return '#FFFFFF'
  const hexPattern = new RegExp('^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
  if (hexPattern.test(str)) return str
  let ctx = document.createElement('canvas').getContext('2d')
  if (ctx) {
    ctx.fillStyle = str
    return ctx.fillStyle
  } else {
    return '#FFFFFF'
  }
}

export function parseFeatureProps(item: any[], header: string[]): TextProps {
  let nameProps = Object.assign({}, DEFAULT_TEXTPROPS)
  let namehtml: string | undefined = item[header.indexOf('namehtml')]
  if (namehtml) {
    nameProps.bold = namehtml.search('<strong>') != -1 ? true : false
    nameProps.italic = namehtml.search('<em>') != -1 ? true : false
    let font_size_match = namehtml.match(/font-size: (\d+)[pt]?;/)
    if (font_size_match?.at(1)) {
      nameProps.fontSize = parseInt(font_size_match[1])
    }
    let color_match = namehtml.match(/color: (#?[\d|A-Z|a-z]+);/)
    if (color_match?.at(1)) {
      nameProps.color = color_match[1]
    }
    let text_align_match = namehtml.match(/text-align: ([a-z|A-Z]+);/)
    if (text_align_match?.at(1)) {
      nameProps.posHor = text_align_match[1]
    }
    let labelvertpos = item[header.indexOf('labelvertpos')]
    nameProps.posVert =
      labelvertpos === 'top'
        ? 'above'
        : labelvertpos === 'middle'
        ? 'center'
        : labelvertpos === 'bottom'
        ? 'below'
        : nameProps.posVert
  }
  return nameProps
}

export function parseRegionProps(item: any[], header: string[]): TextProps {
  let nameProps = Object.assign({}, DEFAULT_TEXTPROPS)
  let genomehtml: string | undefined = item[header.indexOf('genomehtml')]
  if (genomehtml) {
    nameProps.bold = genomehtml.search('<strong>') != -1 ? true : false
    nameProps.italic = genomehtml.search('<em>') != -1 ? true : false
    let font_size_match = genomehtml.match(/font-size: (\d+)[pt]?;/)
    if (font_size_match?.at(1)) {
      nameProps.fontSize = parseInt(font_size_match[1])
    }
    let color_match = genomehtml.match(/color: (#?[\d|A-Z|a-z]+);/)
    if (color_match?.at(1)) {
      nameProps.color = color_match[1]
    }
    let text_align_match = genomehtml.match(/text-align: ([a-z|A-Z]+);/)
    if (text_align_match?.at(1)) {
      nameProps.posHor = text_align_match[1]
    }
  }
  return nameProps
}

export function applyGraphSettings(
  data: Array<Array<any>>,
  geneGraphic: GeneGraphic
) {
  let last_row_first_col = data.at(-1)?.at(0)
  let graphSettings
  if (
    typeof last_row_first_col == 'string' &&
    last_row_first_col.startsWith('GraphSettings:')
  ) {
    graphSettings = JSON.parse(data.pop()?.at(0)?.replace('GraphSettings:', ''))
  }
  if (graphSettings) {
    geneGraphic.width = parseInt(graphSettings['graphwidth'])
    geneGraphic.featureHeight = parseInt(graphSettings['featureheight'])
    let showScale = parseBool(graphSettings['scaleOn'])
    if (typeof showScale == 'boolean') geneGraphic.showScale = showScale
    let multilane = parseBool(graphSettings['multilane'])
    if (typeof multilane == 'boolean') geneGraphic.multilane = multilane
    let gaps = parseBool(graphSettings['keepgaps'])
    if (typeof gaps == 'boolean') geneGraphic.gaps = gaps
    let overlap = parseBool(graphSettings['shiftgenes'])
    if (typeof overlap == 'boolean') geneGraphic.overlap = overlap
    return graphSettings
  } else {
    return null
  }
}

export function getFieldInd(header: string[], possible_fields: string[]) {
  for (let f of possible_fields) {
    let ind = header.indexOf(f)
    if (ind != -1) {
      return ind
    }
  }
  return -1
}

export function getFieldOrBlank(item: any[], index: number): string {
  if (index == -1) {
    return ''
  } else {
    return item[index]
  }
}

export function getIndexes(header: string[]): {} {
  let header_lower = header.map((f) => f.toLowerCase())
  let indexes = {
    start: header_lower.indexOf('start'),
    stop: getFieldInd(header_lower, ['stop', 'end']),
    region_change: getFieldInd(header_lower, [
      'region number',
      'genome',
      'genome id',
    ]),
    region_name: getFieldInd(header_lower, ['genome', 'genome id']),
    feature_name: header_lower.indexOf('name'),
    genome: header_lower.indexOf('genome'),
    genome_id: header_lower.indexOf('genome id'),
    length: getFieldInd(header_lower, [
      'size',
      'size (nt)',
      'length',
      'length (nt)',
    ]),
    color: header_lower.indexOf('color'),
    BRC_ID: getFieldInd(header_lower, ['feature id', 'id']),
    product: header_lower.indexOf('function'),
    patric_global: header_lower.indexOf('patric global family'),
    patric_local: header_lower.indexOf('patric local family'),
    product_length: getFieldInd(header_lower, [
      'product length (aa)',
      'product length',
    ]),
  }
  if (
    indexes.start == -1 ||
    indexes.stop == -1 ||
    indexes.region_change == -1
  ) {
    throw new Error('File format unsupported.')
  }
  return indexes
}

export function getRegionNameHeight(region: Region) {
  return region.nameProps.hide ? 0 : region.nameProps.fontSize * 1.5
}

export function getLanesSize(region: Region, featureHeight: number) {
  let lane1_top_sizes: number[] = [0]
  let lane1_bottom_sizes: number[] = [0]
  let lane2_top_sizes: number[] = [0]
  let lane2_bottom_sizes: number[] = [0]
  region.features.forEach((f) => {
    if (f.lane === 1) {
      if (!f.nameProps.hide && f.nameProps.posVert === 'above') {
        lane1_top_sizes.push(f.nameProps.fontSize)
      } else lane1_top_sizes.push(0)
      if (!f.nameProps.hide && f.nameProps.posVert == 'below') {
        lane1_bottom_sizes.push(f.nameProps.fontSize)
      } else lane1_bottom_sizes.push(0)
    } else if (f.lane === 2) {
      if (!f.nameProps.hide && f.nameProps.posVert === 'above') {
        lane2_top_sizes.push(f.nameProps.fontSize)
      } else lane2_top_sizes.push(0)
      if (!f.nameProps.hide && f.nameProps.posVert == 'below') {
        lane2_bottom_sizes.push(f.nameProps.fontSize)
      } else lane2_bottom_sizes.push(0)
    }
  })

  const lane1_top = Math.max(...lane1_top_sizes)
  const lane1_bottom = Math.max(...lane1_bottom_sizes)
  const lane2_top = region.lanes === 2 ? Math.max(...lane2_top_sizes) : 0
  const lane2_bottom = region.lanes === 2 ? Math.max(...lane2_bottom_sizes) : 0
  const lane1 = featureHeight * 1.2 + lane1_top + lane1_bottom
  const lane2 =
    region.lanes === 2 ? featureHeight * 1.2 + lane2_bottom + lane2_top : 0
  return {
    total: lane1 + lane2,
    lane1: lane1,
    lane2: lane2,
    lane1_top: lane1_top,
    lane2_top: lane2_top,
  }
}

export function getRegionHeight(region: Region, featureHeight: number) {
  return getRegionNameHeight(region) + getLanesSize(region, featureHeight).total
}

export function getRegionTop(pos: number, geneGraphic: GeneGraphic) {
  let y = 0
  let posSortedRegions = geneGraphic.regions.sort((r1, r2) => {
    return r1.position - r2.position
  })
  for (let i = 1; i < pos; i++) {
    y += getRegionHeight(posSortedRegions[i - 1], geneGraphic.featureHeight)
  }
  return y
}
