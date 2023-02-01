import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorSelectionsComponent } from './editor-selections.component';

describe('EditorSelectionsComponent', () => {
  let component: EditorSelectionsComponent;
  let fixture: ComponentFixture<EditorSelectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditorSelectionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorSelectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
