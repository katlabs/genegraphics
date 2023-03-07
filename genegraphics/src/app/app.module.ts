import { NgModule } from '@angular/core';
import { SharedModule } from './shared/shared.module';
import { EditorModule } from './editor/editor.module';
import { GeneGraphicModule } from './gene-graphic/gene-graphic.module';

import { MouseoverInfoComponent } from './mouseover-info/mouseover-info.component';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent, MouseoverInfoComponent],
  imports: [SharedModule, EditorModule, GeneGraphicModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
