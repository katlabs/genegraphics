import { NgModule } from '@angular/core';
import { SharedModule } from './shared/shared.module';
import { EditorModule } from './editor/editor.module';
import { GeneGraphicModule } from './gene-graphic/gene-graphic.module';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [SharedModule, EditorModule, GeneGraphicModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
