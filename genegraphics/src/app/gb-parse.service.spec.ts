import { TestBed } from '@angular/core/testing';

import { GbParseService } from './gb-parse.service';

describe('GbParseService', () => {
  let service: GbParseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GbParseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
