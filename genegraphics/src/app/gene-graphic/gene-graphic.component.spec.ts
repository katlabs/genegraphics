import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneGraphicComponent } from './gene-graphic.component';

describe('GeneGraphicComponent', () => {
  let component: GeneGraphicComponent;
  let fixture: ComponentFixture<GeneGraphicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeneGraphicComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneGraphicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
