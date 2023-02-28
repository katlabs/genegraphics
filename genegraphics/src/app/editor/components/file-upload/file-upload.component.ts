import { Component, Input } from '@angular/core'
import { GeneGraphic } from '@models/models'
import { SelectionService } from '@services/selection.service'
import { TsvParseService } from '@services/tsv-parse.service'
import { JsonImportService } from '@services/json-import.service'
import { GbParseService } from '@services/gb-parse.service'

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadComponent {
  @Input() geneGraphic!: GeneGraphic
  message: string | null = null
  error: boolean = false
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
    } else if (this.type == 'csv') {
      this.message = 'CSV file: ' + this.file?.name
    } else if (this.type === 'json') {
      this.message = 'JSON file: ' + this.file?.name
    } else if (this.type ==='gb'|| this.type ==='gbk'){
      this.message = "GenBank file: " + this.file?.name
    } else {
      this.message = 'Unsupported file uploaded...'
      this.error = true
    }
  }

  cancelImport() {
    this.file = null
    this.type = null
    this.message = null
    this.error = false
  }

  importJson(file: File) {
    this.message = 'Loading...'
    this.jsonImport.importJSON(file)
      .then(() => this.handleSuccessOrError())
      .catch((error) => this.handleSuccessOrError(error))
  }

  handleSuccessOrError(error?:Error){
    if(error) {
      this.message = `Error parsing: ${error.message}`
      this.error = true
    }
    else this.message = "Done!"
    this.file = null;
    this.type = null;
  }

  async importFile(uploadToCurrent: boolean, file: File, type: string) {
    if(!this.file){
      this.handleSuccessOrError(new Error("Not a valid file."))
      return;
    }
    const fileContent = await this.file.text();
    if (type === 'tsv' || type === 'csv') {
      if (uploadToCurrent) {
        this.sel.deselectAll()
        this.message = 'Loading...'
        this.tsvParseService
          .parseAndStore(fileContent, this.geneGraphic)
          .then(() => this.handleSuccessOrError())
          .catch((error) => this.handleSuccessOrError(error))
      } else {
        this.sel.deselectAll()
        this.message = 'Loading...'
        this.tsvParseService
          .parseAndStore(fileContent)
          .then(() => this.handleSuccessOrError())
          .catch((error) => this.handleSuccessOrError(error))      }
    } else if (this.type === 'gb' || this.type === 'gbk') {
      this.sel.deselectAll()
      this.message = 'Loading..'
      if(uploadToCurrent) this.gbParseService
        .parseAndStore(fileContent, this.geneGraphic)
        .then(()=> this.handleSuccessOrError())
        .catch((error)=> this.handleSuccessOrError(error))
      else this.gbParseService
        .parseAndStore(fileContent)
        .then(()=> this.handleSuccessOrError())
        .catch((error)=> this.handleSuccessOrError(error))
    } else {
      this.handleSuccessOrError(new Error("Unsupported filetype."))
    }
  }

  async onClick() {
    this.error = false
    this.message = ""
    let uploader = document.getElementById('uploader')
    if (uploader) {
      uploader.click()
    }
  }
}
