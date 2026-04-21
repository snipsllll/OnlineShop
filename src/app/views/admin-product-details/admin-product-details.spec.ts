import { TestBed } from '@angular/core/testing';
import { AdminProductDetails } from './admin-product-details';
import { ProduktService } from '../../services/produkt.service';
import { StorageService } from '../../services/storage.service';
import { RoutingService } from '../../services/routing.service';
import { ActivatedRoute } from '@angular/router';

function build() {
  TestBed.configureTestingModule({
    providers: [
      AdminProductDetails,
      { provide: ProduktService,  useValue: { getProdukt: vi.fn(), addProdukt: vi.fn(), editProdukt: vi.fn() } },
      { provide: StorageService,  useValue: { imageToBase64: vi.fn() } },
      { provide: RoutingService,  useValue: { route: vi.fn() } },
      { provide: ActivatedRoute,  useValue: { snapshot: { paramMap: { get: vi.fn().mockReturnValue('new') } } } },
    ],
  });
  return TestBed.inject(AdminProductDetails);
}

function setFields(comp: any, overrides: Partial<{ bezeichnung: string; beschreibung: string; preis: number; lagerbestand: number }> = {}) {
  comp.bezeichnung = overrides.bezeichnung ?? 'Produkt A';
  comp.beschreibung = overrides.beschreibung ?? 'Tolle Beschreibung';
  comp.preis = overrides.preis ?? 9.99;
  comp.lagerbestand = overrides.lagerbestand ?? 10;
}

describe('AdminProductDetails – isValid', () => {
  let comp: AdminProductDetails;
  beforeEach(() => { comp = build(); });

  it('returns true when all fields are valid', () => {
    setFields(comp);
    expect(comp.isValid).toBe(true);
  });

  it('returns false when bezeichnung is empty', () => {
    setFields(comp, { bezeichnung: '' });
    expect(comp.isValid).toBe(false);
  });

  it('returns false when bezeichnung is only whitespace', () => {
    setFields(comp, { bezeichnung: '   ' });
    expect(comp.isValid).toBe(false);
  });

  it('returns false when beschreibung is empty', () => {
    setFields(comp, { beschreibung: '' });
    expect(comp.isValid).toBe(false);
  });

  it('returns false when preis is 0', () => {
    setFields(comp, { preis: 0 });
    expect(comp.isValid).toBe(false);
  });

  it('returns false when preis is negative', () => {
    setFields(comp, { preis: -1 });
    expect(comp.isValid).toBe(false);
  });

  it('returns true when lagerbestand is 0 (valid)', () => {
    setFields(comp, { lagerbestand: 0 });
    expect(comp.isValid).toBe(true);
  });
});

describe('AdminProductDetails – removeImage', () => {
  let comp: AdminProductDetails;
  beforeEach(() => { comp = build(); });

  it('removes the image at the given index', () => {
    (comp as any).imgRefs = [
      { id: '1', path: 'a', position: 0 },
      { id: '2', path: 'b', position: 1 },
      { id: '3', path: 'c', position: 2 },
    ];
    comp.removeImage(1);
    expect((comp as any).imgRefs.map((i: any) => i.id)).toEqual(['1', '3']);
  });

  it('re-indexes positions after removal', () => {
    (comp as any).imgRefs = [
      { id: '1', path: 'a', position: 0 },
      { id: '2', path: 'b', position: 1 },
      { id: '3', path: 'c', position: 2 },
    ];
    comp.removeImage(0);
    expect((comp as any).imgRefs.map((i: any) => i.position)).toEqual([0, 1]);
  });

  it('handles removing the only image', () => {
    (comp as any).imgRefs = [{ id: '1', path: 'a', position: 0 }];
    comp.removeImage(0);
    expect((comp as any).imgRefs).toEqual([]);
  });

  it('handles removing the last image', () => {
    (comp as any).imgRefs = [
      { id: '1', path: 'a', position: 0 },
      { id: '2', path: 'b', position: 1 },
    ];
    comp.removeImage(1);
    expect((comp as any).imgRefs.map((i: any) => i.id)).toEqual(['1']);
    expect((comp as any).imgRefs[0].position).toBe(0);
  });
});
