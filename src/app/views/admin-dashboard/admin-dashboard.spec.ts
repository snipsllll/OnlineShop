import { TestBed } from '@angular/core/testing';
import { AdminDashboard } from './admin-dashboard';
import { ProduktService } from '../../services/produkt.service';
import { BestellungService } from '../../services/bestellung.service';
import { RoutingService } from '../../services/routing.service';
import { BestellungsZustand } from '../../models/enums/BestellungsZustand';

function build() {
  TestBed.configureTestingModule({
    providers: [
      AdminDashboard,
      { provide: ProduktService,    useValue: { getProdukte: vi.fn().mockResolvedValue([]), getProduktCount: vi.fn().mockResolvedValue(0) } },
      { provide: BestellungService, useValue: { getBestellungen: vi.fn().mockResolvedValue([]) } },
      { provide: RoutingService,    useValue: { route: vi.fn() } },
    ],
  });
  return TestBed.inject(AdminDashboard);
}

function makeB(id: string, z: BestellungsZustand, isNew: boolean, dateStr: string) {
  return { id, bestellungsZustand: z, isNew, bestelldatum: dateStr } as any;
}

describe('AdminDashboard – countAktuelle', () => {
  let comp: AdminDashboard;
  beforeEach(() => { comp = build(); });

  it('counts EINGEGANGEN and IN_BEARBEITUNG and VERSANDT', () => {
    (comp as any).bestellungen.set([
      makeB('1', BestellungsZustand.EINGEGANGEN, false, '2026-01-01'),
      makeB('2', BestellungsZustand.IN_BEARBEITUNG, false, '2026-01-02'),
      makeB('3', BestellungsZustand.VERSANDT, false, '2026-01-03'),
      makeB('4', BestellungsZustand.ANGEKOMMEN, false, '2026-01-04'),
      makeB('5', BestellungsZustand.STORNIERT, false, '2026-01-05'),
    ]);
    expect(comp.countAktuelle).toBe(3);
  });

  it('returns 0 when all are ANGEKOMMEN or STORNIERT', () => {
    (comp as any).bestellungen.set([
      makeB('1', BestellungsZustand.ANGEKOMMEN, false, '2026-01-01'),
      makeB('2', BestellungsZustand.STORNIERT, false, '2026-01-02'),
    ]);
    expect(comp.countAktuelle).toBe(0);
  });

  it('returns 0 for empty list', () => {
    (comp as any).bestellungen.set([]);
    expect(comp.countAktuelle).toBe(0);
  });
});

describe('AdminDashboard – countUnviewed', () => {
  let comp: AdminDashboard;
  beforeEach(() => { comp = build(); });

  it('counts only orders with isNew === true', () => {
    (comp as any).bestellungen.set([
      makeB('1', BestellungsZustand.EINGEGANGEN, true, '2026-01-01'),
      makeB('2', BestellungsZustand.EINGEGANGEN, false, '2026-01-02'),
      makeB('3', BestellungsZustand.EINGEGANGEN, true, '2026-01-03'),
    ]);
    expect(comp.countUnviewed).toBe(2);
  });

  it('ignores isNew=false and isNew=undefined', () => {
    (comp as any).bestellungen.set([
      makeB('1', BestellungsZustand.EINGEGANGEN, false, '2026-01-01'),
      { ...makeB('2', BestellungsZustand.EINGEGANGEN, false, '2026-01-02'), isNew: undefined },
    ]);
    expect(comp.countUnviewed).toBe(0);
  });
});

describe('AdminDashboard – recentBestellungen', () => {
  let comp: AdminDashboard;
  beforeEach(() => { comp = build(); });

  it('returns max 6 entries', () => {
    const orders = Array.from({ length: 8 }, (_, i) =>
      makeB(`${i}`, BestellungsZustand.EINGEGANGEN, false, `2026-01-0${i + 1}`)
    );
    (comp as any).bestellungen.set(orders);
    expect(comp.recentBestellungen.length).toBe(6);
  });

  it('returns sorted by date descending (most recent first)', () => {
    (comp as any).bestellungen.set([
      makeB('a', BestellungsZustand.EINGEGANGEN, false, '2026-01-01'),
      makeB('b', BestellungsZustand.EINGEGANGEN, false, '2026-03-15'),
      makeB('c', BestellungsZustand.EINGEGANGEN, false, '2026-02-10'),
    ]);
    const ids = comp.recentBestellungen.map(b => b.id);
    expect(ids).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate original bestellungen array', () => {
    const orders = [
      makeB('a', BestellungsZustand.EINGEGANGEN, false, '2026-01-01'),
      makeB('b', BestellungsZustand.EINGEGANGEN, false, '2026-03-15'),
    ];
    (comp as any).bestellungen.set(orders);
    comp.recentBestellungen; // access getter
    expect((comp as any).bestellungen()[0].id).toBe('a'); // original order preserved
  });
});
