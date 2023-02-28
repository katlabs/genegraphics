import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { RegionComponent } from './region/region.component';
import { FeatureComponent } from './feature/feature.component';
import { GeneGraphicComponent } from './gene-graphic.component';

@NgModule({
  declarations: [GeneGraphicComponent, RegionComponent, FeatureComponent],
  imports: [SharedModule],
  exports: [GeneGraphicComponent],
})
export class GeneGraphicModule {}
