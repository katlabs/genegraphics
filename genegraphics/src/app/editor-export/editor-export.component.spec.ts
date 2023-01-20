import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorExportComponent } from './editor-export.component';

describe('EditorExportComponent', () => {
  let component: EditorExportComponent;
  let fixture: ComponentFixture<EditorExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditorExportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
