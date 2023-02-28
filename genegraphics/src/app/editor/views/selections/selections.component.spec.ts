import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionsComponent } from './selections.component';

describe('SelectionsComponent', () => {
  let component: SelectionsComponent;
  let fixture: ComponentFixture<SelectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
