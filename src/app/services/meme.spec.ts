import { TestBed } from '@angular/core/testing';

import { Meme } from './meme';

describe('Meme', () => {
  let service: Meme;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Meme);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
