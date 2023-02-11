import { Injectable } from '@angular/core'
import { toPng, toJpeg, toBlob, toPixelData, toSvg } from 'html-to-image'
import { encodeImage } from 'utif'
import { saveAs } from 'file-saver'

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  constructor() {}

  savePNG() {
    const svg = document.getElementById('gene-graphic')
    if (svg) {
      toPng(svg, { backgroundColor: '#FFFFFF' }).then(function (dataURL) {
        saveAs(dataURL, 'new-genegraphic.png')
      })
    }
  }

  saveSVG() {
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
      })
    }
  }
  saveTIFF() {
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
      })
    }
  }
  saveJSON(){
    console.log("Save me!!!");
  }
}
