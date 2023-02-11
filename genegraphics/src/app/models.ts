export interface TextProps {
  hide: boolean
  bold: boolean
  italic: boolean
  fontSize: number
  fontFamily: string
  color: string
  posHor: string
  posVert: string
}

export interface Selection {
  name?: string
  type: string
  ids_list: (string | number)[]
}

export interface SavedSelection {
  id?: number
  geneGraphicId: number
  selection: Selection
}

export interface Feature {
  id: string
  name: string
  nameProps: TextProps
  start: number
  stop: number
  first_bp: number
  last_bp: number
  size: number
  lane: number
  shape: string
  color1: string
  BRC_ID: string
  Locus_Tag: string
  Gene_Name: string
  Gene_ID: string
  Protein_ID: string
  Uniprot_Acc: string
  Product: string
  PATRIC_Local_Family: string
  PATRIC_Global_Family: string
  Product_Length: string
  color2?: string | null
}

export interface Region {
  id: string
  name: string
  nameProps: TextProps
  position: number
  flipped: boolean
  size: number
  lanes: number
  lines: number
  Genome_ID: string
  Genome_Name: string
  Accession: string
  features: Feature[]
}
export function instanceOfRegion(object: any): object is Region {
  return (
    'id' in object &&
    'name' in object &&
    'nameProps' in object &&
    'position' in object &&
    'size' in object &&
    'lanes' in object &&
    'Genome_ID' in object &&
    'Genome_Name' in object &&
    'Accession' in object &&
    'features' in object
  )
}
export interface GeneGraphic {
  id?: number
  name: string
  nameProps: TextProps
  opened: number
  width: number
  scale_ratio: number
  featureHeight: number
  showScale: boolean
  multilane: boolean
  gaps: boolean
  overlap: boolean
  regions: Region[]
}

export function instanceOfGeneGraphic(object: any): object is GeneGraphic {
  return (
    'id' in object &&
    'name' in object &&
    'nameProps' in object &&
    'opened' in object &&
    'width' in object &&
    'scale_ratio' in object &&
    'showScale' in object &&
    'multilane' in object &&
    'gaps' in object &&
    'overlap' in object &&
    'regions' in object
  )
}
