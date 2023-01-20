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
    let fileContent = await file.text();
    this.tsvParseService.parseAndStore(fileContent, this.newGeneGraphic)
  }

  async onClick(newGeneGraphic: boolean) {
    this.newGeneGraphic = newGeneGraphic;
    let uploader = document.getElementById("uploader");
    if (uploader){
      uploader.click();
    }
  }

}
