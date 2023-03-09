import { Injectable } from '@angular/core';
import { toPng, toPixelData, toSvg } from 'html-to-image';
import { encodeImage } from 'utif';
import { saveAs } from 'file-saver';
import { DatabaseService } from '@services/database.service';
import { exportDB } from 'dexie-export-import';
import { GeneGraphic } from '@models/models';
import { Subject } from 'rxjs';

interface ExportStatus {
  processing: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  status$: Subject<ExportStatus> = new Subject();
  constructor(private db: DatabaseService) {}

  savePNG() {
    this.status$.next({ processing: true, error: null });
    const svg = document.getElementById('gene-graphic');
    if (svg) {
      toPng(svg, { backgroundColor: '#FFFFFF' })
        .then(function (dataURL) {
          saveAs(dataURL, 'new-genegraphic.png');
        })
        .then(() => {
          this.status$.next({ processing: false, error: null });
        })
        .catch(() => {
          this.status$.next({
            processing: false,
            error: 'Could not export PNG. File may be too large.',
          });
        });
    } else
      this.status$.next({
        processing: false,
        error: 'Could not find SVG to export.',
      });
  }

  saveSVG() {
    this.status$.next({ processing: true, error: null });
    const svg = document.getElementById('gene-graphic');
    if (svg) {
      let serializer = new XMLSerializer();
      let svg_uri = serializer.serializeToString(svg);
      svg_uri =
        'data:image/svg+xml;charset=utf-8, ' + encodeURIComponent(svg_uri);
      saveAs(svg_uri, 'new-genegraphic.svg');
      this.status$.next({ processing: false, error: null });
    } else {
      this.status$.next({
        processing: false,
        error: 'Could not find SVG to export.',
      });
    }
  }

  saveSVGEmbedFonts() {
    this.status$.next({ processing: true, error: null });
    const svg = document.getElementById('gene-graphic');
    if (svg) {
      toSvg(svg, { fontEmbedCSS: '' })
        .then(function (dataURL) {
          const svg_header = 'data:image/svg+xml;charset=utf-8,';
          let svgEdited =
            svg_header +
            encodeURIComponent(
              decodeURIComponent(dataURL.substring(svg_header.length)).replace(
                /<\/?foreignObject.*?>/gm,
                '"'
              )
            );
          saveAs(svgEdited, 'new-genegraphic.svg');
        })
        .then(() => {
          this.status$.next({ processing: false, error: null });
        })
        .catch(() => {
          let errormsg = 'Could not export SVG. The file may be too large.';
          this.status$.next({ processing: false, error: errormsg });
        });
    } else {
      this.status$.next({
        processing: false,
        error: 'Could not find SVG to export.',
      });
    }
  }
  saveTIFF() {
    this.status$.next({ processing: true, error: null });
    const svg = document.getElementById('gene-graphic');
    if (svg) {
      const pixel_ratio = window.devicePixelRatio;
      const w = svg.clientWidth;
      const h = svg.clientHeight;

      toPixelData(svg, {
        pixelRatio: 1,
        height: h * pixel_ratio,
        width: w * pixel_ratio,
        canvasWidth: w * pixel_ratio * pixel_ratio,
        canvasHeight: h * pixel_ratio * pixel_ratio,
      })
        .then(function (pixels) {
          const byteArray = new Uint8Array(pixels);
          const tiff = encodeImage(byteArray, w * pixel_ratio, h * pixel_ratio);
          const blob = new Blob([tiff], { type: 'image/tiff' });
          saveAs(blob, 'new-genegraphic.tiff');
        })
        .then(() => this.status$.next({ processing: false, error: null }))
        .catch(() =>
          this.status$.next({
            processing: false,
            error: 'Could not export to TIFF. File may be too large.',
          })
        );
    }
  }

  async saveJSON(geneGraphic?: GeneGraphic) {
    this.status$.next({ processing: true, error: null });
    const blob = await exportDB(this.db, {
      filter: (table: string, value: any, key: any) => {
        if (geneGraphic) {
          return (
            (table === 'geneGraphics' && value.id === geneGraphic.id) ||
            (table === 'selections' && value.geneGraphicId === geneGraphic.id)
          );
        } else {
          return table === 'geneGraphics' || table === 'selections';
        }
      },
    });
    let filename = geneGraphic
      ? `${geneGraphic.name}.json`
      : 'all-genegraphics.json';
    if (blob) {
      saveAs(blob, filename);
      this.status$.next({ processing: false, error: null });
    } else {
      this.status$.next({
        processing: false,
        error: 'Could not save the database.',
      });
    }
  }
}
