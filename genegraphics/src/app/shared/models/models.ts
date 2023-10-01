export interface TextProps {
  hide: boolean;
  bold: boolean;
  italic: boolean;
  fontSize: number;
  fontFamily: string;
  color: string;
  posHor: string;
  posVert: string;
}

export interface Selection {
  name?: string;
  type: string;
  ids_list: string[];
}

export interface Feature {
  id: string;
  name: string;
  nameProps: TextProps;
  start: number;
  stop: number;
  first_bp: number;
  last_bp: number;
  size: number;
  lane: number;
  shape: string;
  colors: string[];
  BRC_ID: string;
  Locus_Tag: string;
  Gene_Name: string;
  Gene_ID: string;
  Protein_ID: string;
  Uniprot_Acc: string;
  Product: string;
  PATRIC_Local_Family: string;
  PATRIC_Global_Family: string;
  Product_Length: string;
}

export interface Region {
  id: string;
  name: string;
  nameProps: TextProps;
  position: number;
  flipped: boolean;
  size: number;
  lanes: number;
  lines: number;
  Genome_ID: string;
  Genome_Name: string;
  Accession: string;
  features: Feature[];
}

export interface GeneGraphic {
  id: string;
  name: string;
  nameProps: TextProps;
  opened: number;
  width: number;
  scale_ratio: number;
  featureHeight: number;
  showScale: boolean;
  scaleSize: number;
  multilane: boolean;
  gaps: boolean;
  overlap: boolean;
  regions: Region[];
  selections: Selection[];
}

export interface NCBIGenome {
  id: string;
  organism: string;
  refseqId: string;
  gbId: string;
}

export interface DataFetch {
  id: string;
  last_fetch: number;
  error: string[];
  data: NCBIGenome[];
}
