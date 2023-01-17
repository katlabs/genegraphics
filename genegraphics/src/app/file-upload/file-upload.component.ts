import { Component } from '@angular/core';
import { TsvParseService } from '../tsv-parse.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {

  fileContent: string = "";
  loading: boolean = false;

  constructor(private tsvParseService: TsvParseService){}

  async onFileChange(event: any){
    let file = event.target.files[0];
    this.fileContent = await file.text();
  }

  onUpload(newSession: boolean) {
    this.loading = true;
    this.tsvParseService.parseAndStore(this.fileContent, newSession)
    this.loading = false;
  }

}
