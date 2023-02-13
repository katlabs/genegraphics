import { Component, Input } from '@angular/core'
import { GeneGraphic } from '../models'
import { SelectionService } from '../selection.service'
import { TsvParseService } from '../tsv-parse.service'
import { JsonImportService } from '../json-import.service'
import { GbParseService } from '../gb-parse.service'

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadComponent {
  @Input() geneGraphic!: GeneGraphic
  message: string | null = null
  file: File | null = null
  type: string | null = null

  constructor(
    private sel: SelectionService,
    private tsvParseService: TsvParseService,
    private jsonImport: JsonImportService,
    private gbParseService: GbParseService
  ) {}

  async onFileChange(event: any) {
    this.file = event.target.files[0]
    if (this.file) this.type = this.file.name.split('.')[1].toLowerCase()
    if (this.type == 'tsv') {
      this.message = 'TSV file: ' + this.file?.name
    } else if (this.type === 'json') {
      this.message = 'JSON file: ' + this.file?.name
    } else if (this.type ==='gb'|| this.type ==='gbk'){
      this.message = "GenBank file: " + this.file?.name
    } else {
      this.message = 'Unsupported file uploaded...'
    }
  }

  cancelImport() {
    this.file = null
    this.type = null
    this.message = null
  }

  importJson(file: File) {
    this.message = 'Loading...'
    this.jsonImport.importJSON(file)
      .then(() => this.handleSuccessOrError())
      .catch((error) => this.handleSuccessOrError(error))
  }

  handleSuccessOrError(error?:Error){
    if(error) this.message = `Error parsing: ${error}`
    else this.message = "Done!"
    this.file = null;
    this.type = null;
  }

  async importFile(uploadToCurrent: boolean, file: File, type: string) {
    if (type === 'tsv') {
      if (uploadToCurrent) {
        this.sel.deselectAll()
        this.message = 'Loading...'
        this.tsvParseService
          .parseAndStore(file, this.geneGraphic)
          .then(() => this.handleSuccessOrError())
          .catch((error) => this.handleSuccessOrError(error))
      } else {
        this.sel.deselectAll()
        this.message = 'Loading...'
        this.tsvParseService
          .parseAndStore(file)
          .then(() => this.handleSuccessOrError())
          .catch((error) => this.handleSuccessOrError(error))      }
    } else if (this.type === 'gb') {
      if(!this.file)throw new Error("A valid file was not found.");
      const fileContents = await this.file.text();
      this.sel.deselectAll()
      this.message = 'Loading..'
      if(uploadToCurrent) this.gbParseService
        .parseAndStore(fileContents, this.geneGraphic)
        .then(()=> this.handleSuccessOrError())
        .catch((error)=> this.handleSuccessOrError(error))
      else this.gbParseService
        .parseAndStore(fileContents)
        .then(()=> this.handleSuccessOrError())
        .catch((error)=> this.handleSuccessOrError(error))
    } else {
      this.message = "Unknown Filetype"
      this.file = null;
      this.type = null;
    }
  }

  async onClick() {
    let uploader = document.getElementById('uploader')
    if (uploader) {
      uploader.click()
    }
  }
}
