import { TestBed } from '@angular/core/testing';

import { NcbiFetchService } from './ncbi-fetch.service';

describe('NcbiFetchService', () => {
  let service: NcbiFetchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NcbiFetchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
