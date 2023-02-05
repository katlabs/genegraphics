import { Component, Input } from '@angular/core';
import { GeneGraphic } from '../models';
import { TsvParseService } from '../tsv-parse.service';
//import { GbParseService } from '../gb-parse.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  @Input() geneGraphic!: GeneGraphic;
  private newGeneGraphic = true;

  constructor(
    private tsvParseService: TsvParseService,
    //private gbParseService: GbParseService
  ){}

  async onFileChange(event: any){
    let file = event.target.files[0];
    let file_ext: string = file.name.split(".")[1];
    if (file_ext.toLowerCase() == "tsv"){
      let fileContent = await file.text();
      await this.tsvParseService
      .parseAndStore(fileContent,
        (!this.newGeneGraphic ? this.geneGraphic : undefined)
      ).catch(error=>console.log(error));
  /*  }else if(file_ext.toLowerCase()=="gb"){
      console.log("gb");
      let fileContent = await file.text();
      await this.gbParseService.parseAndStore(fileContent, this.newGeneGraphic).catch(error=>{
        console.log(error);
      });
      */
    } else {
      console.log("Unknown filetype");
    }
  }

  async onClick(newGeneGraphic: boolean) {
    this.newGeneGraphic = newGeneGraphic;
    let uploader = document.getElementById("uploader");
    if (uploader){
      uploader.click();
    }
  }

}
