import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NcbiFetchComponent } from './ncbi-fetch.component';

describe('NcbiFetchComponent', () => {
  let component: NcbiFetchComponent;
  let fixture: ComponentFixture<NcbiFetchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NcbiFetchComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NcbiFetchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
