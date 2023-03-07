import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MouseoverInfoComponent } from './mouseover-info.component';

describe('MouseoverInfoComponent', () => {
  let component: MouseoverInfoComponent;
  let fixture: ComponentFixture<MouseoverInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MouseoverInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MouseoverInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
