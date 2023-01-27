import { Component } from '@angular/core';
import { TsvParseService } from '../tsv-parse.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {

  private newGeneGraphic = true;

  constructor(private tsvParseService: TsvParseService){}

  async onFileChange(event: any){
    let file = event.target.files[0];
    let file_ext: string = file.name.split(".")[1];
    if (file_ext.toLowerCase() == "tsv"){
      let fileContent = await file.text();
      this.tsvParseService.parseAndStore(fileContent, this.newGeneGraphic).catch(error=>{
        console.log(error);
      })
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
