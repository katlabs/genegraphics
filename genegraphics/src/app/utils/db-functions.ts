import {
  GeneGraphic,
} from '../models'
import { DatabaseService } from '../database.service';
import { liveQuery } from 'dexie'

export const DEFAULT_TEXTPROPS = {
  show: true,
  bold: false,
  italic: false,
  fontSize: 16,
  fontFamily: 'Arial, sans-serif',
  color: '#000000',
  posHor: 'left',
  posVert: 'above',
}

export function getMaxRegionPosition(geneGraphic: GeneGraphic){
  if (!geneGraphic || !geneGraphic.regions || geneGraphic.regions.length===0){
    return 0
  }else{
    let id = Math.max(...geneGraphic.regions.map(r=>r.position));
    if(id && id>0) return id;
    else return 0;
  }
}
export function getCurrentGeneGraphic(db: DatabaseService) {
  return liveQuery(() => db.geneGraphics.orderBy('opened').last())
}

export async function createGeneGraphic(db: DatabaseService) {
  const newGeneGraphic:GeneGraphic = {
    title: 'New GeneGraphic',
    titleProps: DEFAULT_TEXTPROPS,
    opened: Date.now(),
    width: 1000,
    featureHeight: 50,
    showScale: true,
    scale_ratio: 0.2,
    multilane: true,
    gaps: false,
    overlap: false,
    regions: []
  }
  return await db.transaction('rw', db.geneGraphics, async () => {
    const new_id = await db.geneGraphics.add(newGeneGraphic)
    return await db.geneGraphics.get(new_id)
  })
}

export async function deleteGeneGraphic(db: DatabaseService, geneGraphic: GeneGraphic){
  await db.transaction('rw', db.geneGraphics, async ()=>{
    await db.geneGraphics.where({id: geneGraphic.id}).delete();
    const geneGraphics = await db.geneGraphics.toArray();
    if(geneGraphics.length < 1){
      await createGeneGraphic(db);
    }
  })
}

export async function updateGeneGraphic(db: DatabaseService, geneGraphic: GeneGraphic, update:{[key:string]:string}){
  Object.assign(geneGraphic,update);
  const updateScaleOn = ['width'];
  const updateShiftsOn = ['multilane','overlap','gaps'];
  if(Object.keys(update).some(r=> updateShiftsOn.indexOf(r) >= 0)){
    applyShifts(geneGraphic)
  } else if(Object.keys(update).some(r=> updateScaleOn.indexOf(r) >= 0)){
    updateScaleRatio(geneGraphic);
  }
  await db.geneGraphics.put(geneGraphic);
}

export async function updateGeneGraphicTitleProps(db: DatabaseService, geneGraphic:GeneGraphic, update:{[key:string]:string}){
  if(geneGraphic.id) await db.geneGraphics.update(geneGraphic.id,update);
}

export function applyShifts(geneGraphic: GeneGraphic) {
  geneGraphic.regions.forEach((region)=>{
    const region_start = Math.min(region.features[0].start,region.features[0].stop);
    region.features.forEach((feature,i,arr)=>{
      if(i===0){
        feature.first_bp = 0;
        feature.last_bp = feature.size;
        feature.lane = 1;
      }else{
        const curr_first = Math.min(feature.start,feature.stop);
        const curr_last = Math.max(feature.start, feature.stop);
        const prev_last = Math.max(arr[i-1].start,arr[i-1].stop);
        if (geneGraphic.multilane){ //No feature shifting, lane shifting.
          feature.first_bp = curr_first - region_start;
          feature.last_bp = curr_last - region_start;
          // Move to lane 2 if overlap & prev was not moved.
          if(curr_first<prev_last && arr[i-1].lane !== 2) feature.lane = 2;
          else feature.lane = 1;
        }else if(geneGraphic.overlap){ //No feature shifting, no lane shifting.
          feature.first_bp = curr_first - region_start;
          feature.last_bp = curr_last - region_start;
          feature.lane = 1;
        }else if(geneGraphic.gaps){ // Features shift, no lane shifting, keep gaps
          if (curr_first<prev_last){// Features overlap
            feature.first_bp = arr[i-1].last_bp + 1;
            feature.last_bp = feature.first_bp + feature.size;
            feature.lane = 1;
          }else{ //Keep any gaps 
            feature.first_bp = arr[i-1].last_bp + (curr_first-prev_last) + 1;
            feature.last_bp = feature.first_bp + feature.size;
            feature.lane = 1;
          }
        }else{ // Features shift, no lane shifting, remove gaps.
          feature.first_bp = arr[i-1].last_bp + 1;
          feature.last_bp = feature.first_bp + feature.size;
          feature.lane = 1;
        }
      }
    })
    const len = region.features.length;
    if (len!==0){
      region.size = region.features[len-1].last_bp-region.features[0].first_bp;
    } else {
      region.size = 0;
    }
    if (region.features.some(f => f.lane === 2)) region.lanes = 2;
    else region.lanes = 1;
  })
  updateScaleRatio(geneGraphic);
}

export function updateScaleRatio(geneGraphic:GeneGraphic){
  const max_region_size = Math.max(...geneGraphic.regions.map(r=>r.size));
  if(geneGraphic.regions.length>0 && max_region_size!==0){
    geneGraphic.scale_ratio = geneGraphic.width/max_region_size;
  } else{ // Default scale if there are no regions
    geneGraphic.scale_ratio = 0.2;
  }
}

export async function saveImportedData(
  db: DatabaseService,
  geneGraphic: GeneGraphic,
) {
  applyShifts(geneGraphic);
  return await db.geneGraphics.put(geneGraphic);
}
