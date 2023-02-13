import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http'

import { MatTabsModule } from '@angular/material/tabs'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatIconModule } from '@angular/material/icon'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 

import { AppComponent } from './app.component'
import { GeneGraphicComponent } from './gene-graphic/gene-graphic.component'
import { RegionComponent } from './region/region.component'
import { FeatureComponent } from './feature/feature.component'
import { FileUploadComponent } from './file-upload/file-upload.component'
import { EditorComponent } from './editor/editor.component'
import { EditorDataComponent } from './editor-data/editor-data.component'
import { EditorSettingsComponent } from './editor-settings/editor-settings.component'
import { EditorExportComponent } from './editor-export/editor-export.component'
import { EditorSelectionsComponent } from './editor-selections/editor-selections.component'
import { EditorFeaturesComponent } from './editor-features/editor-features.component'
import { EditorRegionsComponent } from './editor-regions/editor-regions.component'
import { NcbiFetchComponent } from './ncbi-fetch/ncbi-fetch.component';
import { EditorTextComponent } from './editor-text/editor-text.component';
import { AboutComponent } from './about/about.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'

@NgModule({
  declarations: [
    AppComponent,
    GeneGraphicComponent,
    RegionComponent,
    FeatureComponent,
    FileUploadComponent,
    EditorComponent,
    EditorDataComponent,
    EditorSettingsComponent,
    EditorExportComponent,
    EditorSelectionsComponent,
    EditorFeaturesComponent,
    EditorRegionsComponent,
    NcbiFetchComponent,
    EditorTextComponent,
    AboutComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    HttpClientModule,
    FontAwesomeModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
