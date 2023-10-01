import { Component, Input } from "@angular/core";
import { GeneGraphic, Region } from "@models/models";
import { SelectionService } from "@services/selection.service";
import { getRegionTop } from "@helpers/utils";

@Component({
  selector: "app-gene-graphic",
  templateUrl: "./gene-graphic.component.svg",
  styleUrls: ["./gene-graphic.component.scss"],
})
export class GeneGraphicComponent {
  @Input() geneGraphic!: GeneGraphic;

  constructor(private sel: SelectionService) {}

  getSvgHeight() {
    let height = 0;
    height += this.getRegionsY();
    height += getRegionTop(
      this.geneGraphic.regions.length + 1,
      this.geneGraphic
    );
    return height;
  }

  getTitleY() {
    if (!this.geneGraphic.nameProps.hide) {
      return this.geneGraphic.nameProps.fontSize;
    } else {
      return 0;
    }
  }

  getTitleX() {
    const paddedWidth = this.geneGraphic.width - 20;
    if (this.geneGraphic.nameProps.posHor === "center") return paddedWidth / 2;
    else if (this.geneGraphic.nameProps.posHor === "right") return paddedWidth;
    else return "10";
  }

  getTitleAnchor() {
    if (this.geneGraphic.nameProps.posHor === "center") return "middle";
    else if (this.geneGraphic.nameProps.posHor === "right") return "end";
    else return "start";
  }

  getScaleY() {
    if (!this.geneGraphic.showScale) return 0;
    let y = 10;
    if (!this.geneGraphic.nameProps.hide)
      y += this.geneGraphic.nameProps.fontSize;
    return y;
  }

  getRegionsY() {
    let y = 40;
    if (!this.geneGraphic.nameProps.hide)
      y += this.geneGraphic.nameProps.fontSize;
    if (this.geneGraphic.showScale) y += 35;
    return y;
  }

  getRegionsTransform() {
    return `translate(10,${this.getRegionsY()})`;
  }

  getRegionTransform(region: Region) {
    return `translate(0,${getRegionTop(region.position, this.geneGraphic)})`;
  }

  getScaleTransform() {
    return `translate(10,${this.getScaleY()})`;
  }

  bpToPx(bp: number) {
    return bp * this.geneGraphic.scale_ratio;
  }

  getScalePoints() {
    let width = this.bpToPx(1000 * this.geneGraphic.scaleSize);
    return `10,10,10,25,${width},25,${width},10`;
  }

  editGeneGraphic(e: MouseEvent) {
    e.stopPropagation();
    if (this.geneGraphic.id) {
      const multi = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
      this.sel.selectItem(this.geneGraphic.id, "geneGraphic", multi);
    } else {
      this.sel.deselectAll();
    }
  }
}
