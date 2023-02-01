import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorRegionsComponent } from './editor-regions.component';

describe('EditorRegionsComponent', () => {
  let component: EditorRegionsComponent;
  let fixture: ComponentFixture<EditorRegionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditorRegionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorRegionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
