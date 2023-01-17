import { Component } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {

  fileContent: string = "";
  loading: boolean = false;

  constructor(){}

  async onFileChange(event: any){
    let file = event.target.files[0];
    this.fileContent = await file.text();
  }

  onUpload(newSession: boolean) {
    this.loading = true;
    console.log(this.fileContent);
    this.loading = false;
  }

}
