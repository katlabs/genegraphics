import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTextPropsComponent } from './edit-text-props.component';

describe('EditTextPropsComponent', () => {
  let component: EditTextPropsComponent;
  let fixture: ComponentFixture<EditTextPropsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditTextPropsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTextPropsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
