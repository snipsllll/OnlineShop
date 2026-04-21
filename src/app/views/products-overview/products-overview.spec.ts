import { TestBed } from '@angular/core/testing';
import { ProductsOverview } from './products-overview';
import { ProduktService } from '../../services/produkt.service';
import { FavoritService } from '../../services/favorit.service';

function build() {
  TestBed.configureTestingModule({
    providers: [
      ProductsOverview,
      { provide: ProduktService, useValue: { getProdukte: vi.fn().mockResolvedValue([]) } },
      { provide: FavoritService, useValue: { getFavoritenIds: vi.fn().mockResolvedValue([]) } },
    ],
  });
  return TestBed.inject(ProductsOverview);
}

function makeP(id: string, bezeichnung: string, beschreibung: string, preis: number, verfuegbar: boolean, lager: number): any {
  return { id, bezeichnung, beschreibung, preis, verfuegbar, lagerbestand: lager };
}

const PRODUCTS = [
  makeP('1', 'Zitrone', 'Frucht', 2,  true,  10),
  makeP('2', 'Apfel',   'Frucht', 1,  true,  5),
  makeP('3', 'Birne',   'Süß',    3,  false, 0),
  makeP('4', 'Mango',   'Exotisch',5, true,  0),
];

describe('ProductsOverview – filteredProdukte text filter', () => {
  let comp: ProductsOverview;
  beforeEach(() => { comp = build(); (comp as any).produkte.set(PRODUCTS); });

  it('returns all when searchText is empty', () => {
    (comp as any).searchText = '';
    expect(comp.filteredProdukte.length).toBe(4);
  });

  it('filters by bezeichnung (case-insensitive)', () => {
    (comp as any).searchText = 'apf';
    expect(comp.filteredProdukte.map(p => p.id)).toContain('2');
    expect(comp.filteredProdukte.length).toBe(1);
  });

  it('filters by beschreibung', () => {
    (comp as any).searchText = 'exotisch';
    expect(comp.filteredProdukte.map(p => p.id)).toContain('4');
  });
});

describe('ProductsOverview – filteredProdukte availability filter', () => {
  let comp: ProductsOverview;
  beforeEach(() => { comp = build(); (comp as any).produkte.set(PRODUCTS); });

  it('showOnlyAvailable filters out unavailable and zero-stock', () => {
    (comp as any).showOnlyAvailable = true;
    const ids = comp.filteredProdukte.map(p => p.id);
    expect(ids).toContain('1');
    expect(ids).toContain('2');
    expect(ids).not.toContain('3'); // verfuegbar=false
    expect(ids).not.toContain('4'); // lagerbestand=0
  });
});

describe('ProductsOverview – filteredProdukte sorting', () => {
  let comp: ProductsOverview;
  beforeEach(() => { comp = build(); (comp as any).produkte.set(PRODUCTS); });

  it('default sort is by name (alphabetical)', () => {
    (comp as any).sortBy = 'name';
    const names = comp.filteredProdukte.map(p => p.bezeichnung);
    expect(names).toEqual(['Apfel', 'Birne', 'Mango', 'Zitrone']);
  });

  it('preis-asc sorts by price ascending', () => {
    (comp as any).sortBy = 'preis-asc';
    const preise = comp.filteredProdukte.map(p => p.preis);
    expect(preise).toEqual([1, 2, 3, 5]);
  });

  it('preis-desc sorts by price descending', () => {
    (comp as any).sortBy = 'preis-desc';
    const preise = comp.filteredProdukte.map(p => p.preis);
    expect(preise).toEqual([5, 3, 2, 1]);
  });
});

describe('ProductsOverview – totalPages', () => {
  let comp: ProductsOverview;
  beforeEach(() => { comp = build(); });

  it('returns 1 for empty list', () => {
    (comp as any).produkte.set([]);
    expect(comp.totalPages).toBe(1);
  });

  it('returns correct page count for exactly 24 items', () => {
    const items = Array.from({ length: 24 }, (_, i) => makeP(`${i}`, `P${i}`, '', 1, true, 1));
    (comp as any).produkte.set(items);
    expect(comp.totalPages).toBe(1);
  });

  it('returns 2 for 25 items (PAGE_SIZE=24)', () => {
    const items = Array.from({ length: 25 }, (_, i) => makeP(`${i}`, `P${i}`, '', 1, true, 1));
    (comp as any).produkte.set(items);
    expect(comp.totalPages).toBe(2);
  });
});

describe('ProductsOverview – pagedProdukte', () => {
  let comp: ProductsOverview;
  beforeEach(() => { comp = build(); });

  it('returns only the current page slice', () => {
    const items = Array.from({ length: 30 }, (_, i) => makeP(`${i}`, `P${i}`, '', 1, true, 1));
    (comp as any).produkte.set(items);
    (comp as any).currentPage.set(2);
    expect(comp.pagedProdukte.length).toBe(6); // 30 - 24 = 6 on page 2
  });
});

describe('ProductsOverview – goToPage guards', () => {
  let comp: ProductsOverview;
  beforeEach(() => {
    comp = build();
    const items = Array.from({ length: 50 }, (_, i) => makeP(`${i}`, `P${i}`, '', 1, true, 1));
    (comp as any).produkte.set(items);
    (comp as any).currentPage.set(1);
  });

  it('does not change page when page < 1', () => {
    comp.goToPage(0);
    expect((comp as any).currentPage()).toBe(1);
  });

  it('does not change page when page === currentPage', () => {
    comp.goToPage(1);
    expect((comp as any).currentPage()).toBe(1);
  });

  it('does not change page when page > totalPages', () => {
    comp.goToPage(999);
    expect((comp as any).currentPage()).toBe(1);
  });

  it('changes page for a valid page number', () => {
    comp.goToPage(2);
    expect((comp as any).currentPage()).toBe(2);
  });
});

describe('ProductsOverview – pageNumbers', () => {
  let comp: ProductsOverview;
  beforeEach(() => { comp = build(); });

  it('returns [1..total] when total <= 7', () => {
    const items = Array.from({ length: 5 * 24 }, (_, i) => makeP(`${i}`, `P${i}`, '', 1, true, 1));
    (comp as any).produkte.set(items);
    expect(comp.pageNumbers).toEqual([1, 2, 3, 4, 5]);
  });

  it('includes first and last page when total > 7', () => {
    const items = Array.from({ length: 10 * 24 }, (_, i) => makeP(`${i}`, `P${i}`, '', 1, true, 1));
    (comp as any).produkte.set(items);
    const pages = comp.pageNumbers;
    expect(pages[0]).toBe(1);
    expect(pages[pages.length - 1]).toBe(10);
  });
});
