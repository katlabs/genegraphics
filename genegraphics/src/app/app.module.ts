import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { GeneGraphicComponent } from './gene-graphic/gene-graphic.component';
import { RegionComponent } from './region/region.component';
import { FeatureComponent } from './feature/feature.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { EditorComponent } from './editor/editor.component';

@NgModule({
  declarations: [
    AppComponent,
    GeneGraphicComponent,
    RegionComponent,
    FeatureComponent,
    FileUploadComponent,
    EditorComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
