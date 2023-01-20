import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { GeneGraphicComponent } from './gene-graphic/gene-graphic.component';
import { RegionComponent } from './region/region.component';
import { FeatureComponent } from './feature/feature.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { EditorComponent } from './editor/editor.component';
import { EditorGeneGraphicComponent } from './editor-gene-graphic/editor-gene-graphic.component';
import { EditorSettingsComponent } from './editor-settings/editor-settings.component';
import { EditorExportComponent } from './editor-export/editor-export.component';

@NgModule({
  declarations: [
    AppComponent,
    GeneGraphicComponent,
    RegionComponent,
    FeatureComponent,
    FileUploadComponent,
    EditorComponent,
    EditorGeneGraphicComponent,
    EditorSettingsComponent,
    EditorExportComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
