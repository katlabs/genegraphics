import { TestBed } from '@angular/core/testing';

import { MouseoverInfoService } from './mouseover-info.service';

describe('MouseoverInfoService', () => {
  let service: MouseoverInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MouseoverInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
