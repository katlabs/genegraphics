import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFeaturesComponent } from './edit-features.component';

describe('EditFeaturesComponent', () => {
  let component: EditFeaturesComponent;
  let fixture: ComponentFixture<EditFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditFeaturesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
