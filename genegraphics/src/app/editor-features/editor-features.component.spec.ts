import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorFeaturesComponent } from './editor-features.component';

describe('EditorFeaturesComponent', () => {
  let component: EditorFeaturesComponent;
  let fixture: ComponentFixture<EditorFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditorFeaturesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
