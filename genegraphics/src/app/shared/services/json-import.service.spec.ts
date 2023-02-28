import { TestBed } from '@angular/core/testing';

import { JsonImportService } from '@services/json-import.service';

describe('JsonImportService', () => {
  let service: JsonImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
