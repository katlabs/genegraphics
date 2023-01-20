import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorGeneGraphicComponent } from './editor-gene-graphic.component';

describe('EditorGeneGraphicComponent', () => {
  let component: EditorGeneGraphicComponent;
  let fixture: ComponentFixture<EditorGeneGraphicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditorGeneGraphicComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorGeneGraphicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
