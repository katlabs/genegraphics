import { Injectable } from '@angular/core'
import { toPng, toPixelData, toSvg } from 'html-to-image'
import { encodeImage } from 'utif'
import { saveAs } from 'file-saver'
import { DatabaseService } from './database.service'
import { exportDB } from 'dexie-export-import'
import { GeneGraphic } from './models'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  processing$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  constructor(private db: DatabaseService) {}

  savePNG() {
    this.processing$.next(true)
    const svg = document.getElementById('gene-graphic')
    if (svg) {
      toPng(svg, { backgroundColor: '#FFFFFF' }).then(function (dataURL) {
        saveAs(dataURL, 'new-genegraphic.png')
      }).then(()=>{
          this.processing$.next(false)
        })
    } else throw new Error("Unable to export the SVG")
  }

  saveSVG() {
    this.processing$.next(true);
    const svg = document.getElementById('gene-graphic')
    if (svg) {
      toSvg(svg).then(function (dataURL) {
        const svg_header = 'data:image/svg+xml;charset=utf-8,'
        let svgEdited =
          svg_header +
          encodeURIComponent(
            decodeURIComponent(dataURL.substring(svg_header.length)).replace(
              /<\/?foreignObject.*?>/gm,
              '"'
            )
          )
        saveAs(svgEdited, 'new-genegraphic.svg')
      }).then(()=>
          this.processing$.next(false)
        )
    }
  }
  saveTIFF() {
    this.processing$.next(true);
    const svg = document.getElementById('gene-graphic')
    console.log(svg?.clientHeight, svg?.clientWidth)
    if (svg) {
      const pixel_ratio = window.devicePixelRatio
      const w = svg.clientWidth
      const h = svg.clientHeight

      toPixelData(svg, {
        pixelRatio: 1,
        height: h * pixel_ratio,
        width: w * pixel_ratio,
        canvasWidth: w * pixel_ratio * pixel_ratio,
        canvasHeight: h * pixel_ratio * pixel_ratio,
      }).then(function (pixels) {
        const byteArray = new Uint8Array(pixels)
        const tiff = encodeImage(byteArray, w * pixel_ratio, h * pixel_ratio)
        const blob = new Blob([tiff], { type: 'image/tiff' })
        saveAs(blob, 'new-genegraphic.tiff')
      }).then(()=> this.processing$.next(false))
    }
  }

  async saveJSON(geneGraphic?: GeneGraphic) {
    this.processing$.next(true);
    const blob = await exportDB(this.db, {
      filter: (table: string, value: any, key: any) => {
        if(geneGraphic){
        return (table === 'geneGraphics' && value.id === geneGraphic.id) ||
          (table === 'selections' && value.geneGraphicId === geneGraphic.id);
        } else {
          return (table === 'geneGraphics' || table === 'selections');
        }
      },
    })
    let filename = geneGraphic ? `${geneGraphic.name}.json` : "all-genegraphics.json" 
    saveAs(blob, filename)
    this.processing$.next(false);
  }
}
