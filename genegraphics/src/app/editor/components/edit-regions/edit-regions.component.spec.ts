import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditRegionsComponent } from './edit-regions.component';

describe('EditRegionsComponent', () => {
  let component: EditRegionsComponent;
  let fixture: ComponentFixture<EditRegionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditRegionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditRegionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
