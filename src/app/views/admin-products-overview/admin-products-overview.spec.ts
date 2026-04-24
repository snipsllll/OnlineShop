import { TestBed } from '@angular/core/testing';
import { AdminProductsOverview } from './admin-products-overview';
import { ProduktService } from '../../services/produkt.service';
import { RoutingService } from '../../services/routing.service';
import { DialogService } from '../../services/dialog.service';

const MOCK_PRODUKTE = [
  { id: 'p1', bezeichnung: 'Alpha', beschreibung: 'd', preis: 10, lagerbestand: 5, verfuegbar: true,  imgRefs: [{ id: '1', path: 'x', position: 0 }] },
  { id: 'p2', bezeichnung: 'Beta',  beschreibung: 'd', preis: 25, lagerbestand: 0, verfuegbar: false, imgRefs: [] },
  { id: 'p3', bezeichnung: 'Gamma', beschreibung: 'd', preis: 5,  lagerbestand: 20, verfuegbar: true, imgRefs: [] },
];

function build() {
  TestBed.configureTestingModule({
    providers: [
      AdminProductsOverview,
      { provide: ProduktService,  useValue: {
          getProdukte: vi.fn().mockResolvedValue([...MOCK_PRODUKTE]),
          getProduktCount: vi.fn().mockResolvedValue(MOCK_PRODUKTE.length),
          getProduktePage: vi.fn().mockResolvedValue({ items: MOCK_PRODUKTE, lastDoc: null }),
          deleteProdukt: vi.fn(),
        }
      },
      { provide: RoutingService,  useValue: { route: vi.fn() } },
      { provide: DialogService,   useValue: { openConfirm: vi.fn(), openMessage: vi.fn() } },
    ],
  });
  return TestBed.inject(AdminProductsOverview);
}

function seedFiltered(comp: any, items = MOCK_PRODUKTE) {
  comp['_allProdukte'] = [...items];
  comp['searchActive'].set(true);
}

describe('AdminProductsOverview – applyAllFilters text search', () => {
  let comp: AdminProductsOverview;
  beforeEach(() => { comp = build(); });

  it('filters by bezeichnung (case-insensitive)', () => {
    seedFiltered(comp);
    (comp as any)._searchText = 'alph';
    (comp as any).applyAllFilters();
    expect((comp as any)._filteredProdukte.map((p: any) => p.id)).toEqual(['p1']);
  });

  it('shows all when searchText is empty', () => {
    seedFiltered(comp);
    (comp as any)._searchText = '';
    (comp as any).applyAllFilters();
    expect((comp as any)._filteredProdukte.length).toBe(3);
  });
});

describe('AdminProductsOverview – applyAllFilters price filter', () => {
  let comp: AdminProductsOverview;
  beforeEach(() => { comp = build(); });

  it('filterPreisMin filters products below min price', () => {
    seedFiltered(comp);
    comp['filterPreisMin'] = '10';
    (comp as any).applyAllFilters();
    const ids = (comp as any)._filteredProdukte.map((p: any) => p.id);
    expect(ids).toContain('p1');
    expect(ids).toContain('p2');
    expect(ids).not.toContain('p3'); // preis=5 < 10
  });

  it('filterPreisMax filters products above max price', () => {
    seedFiltered(comp);
    comp['filterPreisMax'] = '10';
    (comp as any).applyAllFilters();
    const ids = (comp as any)._filteredProdukte.map((p: any) => p.id);
    expect(ids).toContain('p1');
    expect(ids).toContain('p3');
    expect(ids).not.toContain('p2'); // preis=25 > 10
  });

  it('invalid filterPreisMin is ignored and all products are shown', () => {
    seedFiltered(comp);
    comp['filterPreisMin'] = 'abc';
    (comp as any).applyAllFilters();
    expect((comp as any)._filteredProdukte.length).toBe(3);
  });

  it('invalid filterPreisMax is ignored and all products are shown', () => {
    seedFiltered(comp);
    comp['filterPreisMax'] = 'abc';
    (comp as any).applyAllFilters();
    expect((comp as any)._filteredProdukte.length).toBe(3);
  });
});

describe('AdminProductsOverview – applyAllFilters stock filter', () => {
  let comp: AdminProductsOverview;
  beforeEach(() => { comp = build(); });

  it('filterLagerMin filters by minimum stock', () => {
    seedFiltered(comp);
    comp['filterLagerMin'] = '5';
    (comp as any).applyAllFilters();
    const ids = (comp as any)._filteredProdukte.map((p: any) => p.id);
    expect(ids).toContain('p1'); // lager=5
    expect(ids).toContain('p3'); // lager=20
    expect(ids).not.toContain('p2'); // lager=0
  });

  it('invalid filterLagerMin is ignored and all products are shown', () => {
    seedFiltered(comp);
    comp['filterLagerMin'] = 'xyz';
    (comp as any).applyAllFilters();
    expect((comp as any)._filteredProdukte.length).toBe(3);
  });
});

describe('AdminProductsOverview – applyAllFilters verfuegbar / image filter', () => {
  let comp: AdminProductsOverview;
  beforeEach(() => { comp = build(); });

  it('filterVerfuegbar=true shows only available products', () => {
    seedFiltered(comp);
    comp['filterVerfuegbar'] = 'true';
    (comp as any).applyAllFilters();
    const ids = (comp as any)._filteredProdukte.map((p: any) => p.id);
    expect(ids).toContain('p1');
    expect(ids).toContain('p3');
    expect(ids).not.toContain('p2');
  });

  it('filterHasImage=yes shows only products with images', () => {
    seedFiltered(comp);
    comp['filterHasImage'] = 'yes';
    (comp as any).applyAllFilters();
    expect((comp as any)._filteredProdukte.map((p: any) => p.id)).toEqual(['p1']);
  });

  it('filterHasImage=no shows only products without images', () => {
    seedFiltered(comp);
    comp['filterHasImage'] = 'no';
    (comp as any).applyAllFilters();
    const ids = (comp as any)._filteredProdukte.map((p: any) => p.id);
    expect(ids).toContain('p2');
    expect(ids).toContain('p3');
    expect(ids).not.toContain('p1');
  });
});

describe('AdminProductsOverview – toggleSort', () => {
  let comp: AdminProductsOverview;
  beforeEach(() => { comp = build(); });

  it('first click sets column to asc', () => {
    comp.toggleSort('preis');
    expect(comp['sortCol']()).toBe('preis');
    expect(comp['sortDir']()).toBe('asc');
  });

  it('second click on same column switches to desc', () => {
    comp.toggleSort('preis');
    comp.toggleSort('preis');
    expect(comp['sortDir']()).toBe('desc');
  });

  it('third click on same column clears sort', () => {
    comp.toggleSort('preis');
    comp.toggleSort('preis');
    comp.toggleSort('preis');
    expect(comp['sortCol']()).toBeNull();
  });

  it('clicking a different column resets to asc', () => {
    comp.toggleSort('preis');
    comp.toggleSort('preis'); // → desc
    comp.toggleSort('bezeichnung'); // → different col
    expect(comp['sortCol']()).toBe('bezeichnung');
    expect(comp['sortDir']()).toBe('asc');
  });
});

describe('AdminProductsOverview – selection', () => {
  let comp: AdminProductsOverview;
  beforeEach(() => { comp = build(); });

  it('toggleSelect adds and removes from selectedIds', () => {
    comp.toggleSelect('p1');
    expect(comp.isSelected('p1')).toBe(true);
    comp.toggleSelect('p1');
    expect(comp.isSelected('p1')).toBe(false);
  });

  it('clearSelection empties selectedIds', () => {
    comp.toggleSelect('p1');
    comp.toggleSelect('p2');
    comp.clearSelection();
    expect(comp['selectedIds']().size).toBe(0);
  });

  it('selectedCount returns correct count', () => {
    comp.toggleSelect('p1');
    comp.toggleSelect('p2');
    expect(comp.selectedCount()).toBe(2);
  });
});
