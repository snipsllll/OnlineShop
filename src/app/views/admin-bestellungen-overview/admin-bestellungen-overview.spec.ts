import { TestBed } from '@angular/core/testing';
import { AdminBestellungenOverview } from './admin-bestellungen-overview';
import { BestellungService } from '../../services/bestellung.service';
import { RoutingService } from '../../services/routing.service';
import { DialogService } from '../../services/dialog.service';
import { BestellungsZustand } from '../../models/enums/BestellungsZustand';
import { ZahlungsZustand } from '../../models/enums/ZahlungsZustand';

function build() {
  TestBed.configureTestingModule({
    providers: [
      AdminBestellungenOverview,
      { provide: BestellungService, useValue: { getBestellungen: vi.fn().mockResolvedValue([]), editBestellung: vi.fn(), deleteBestellung: vi.fn() } },
      { provide: RoutingService,    useValue: { route: vi.fn() } },
      { provide: DialogService,     useValue: { openConfirm: vi.fn() } },
    ],
  });
  return TestBed.inject(AdminBestellungenOverview);
}

function makeB(id: string, z: BestellungsZustand, zahl: ZahlungsZustand = ZahlungsZustand.BEZAHLT, isNew = false) {
  return { id, bestellungsZustand: z, zahlungsZustand: zahl, isNew, produkte: [], bestelldatum: '2026-01-01' } as any;
}

describe('AdminBestellungenOverview – filteredBestellungen / baseList', () => {
  let comp: AdminBestellungenOverview;
  beforeEach(() => { comp = build(); });

  it('aktuelle mode hides ANGEKOMMEN and STORNIERT', () => {
    (comp as any).bestellungen.set([
      makeB('1', BestellungsZustand.EINGEGANGEN),
      makeB('2', BestellungsZustand.ANGEKOMMEN),
      makeB('3', BestellungsZustand.STORNIERT),
      makeB('4', BestellungsZustand.VERSANDT),
    ]);
    (comp as any).viewMode = 'aktuelle';
    const ids = comp.filteredBestellungen.map(b => b.id);
    expect(ids).toContain('1');
    expect(ids).toContain('4');
    expect(ids).not.toContain('2');
    expect(ids).not.toContain('3');
  });

  it('alle mode shows all orders', () => {
    (comp as any).bestellungen.set([
      makeB('1', BestellungsZustand.EINGEGANGEN),
      makeB('2', BestellungsZustand.ANGEKOMMEN),
      makeB('3', BestellungsZustand.STORNIERT),
    ]);
    (comp as any).viewMode = 'alle';
    expect(comp.filteredBestellungen.length).toBe(3);
  });

  it('filterZustand filters by status', () => {
    (comp as any).bestellungen.set([
      makeB('1', BestellungsZustand.EINGEGANGEN),
      makeB('2', BestellungsZustand.IN_BEARBEITUNG),
      makeB('3', BestellungsZustand.EINGEGANGEN),
    ]);
    (comp as any).viewMode = 'alle';
    (comp as any).filterZustand = BestellungsZustand.EINGEGANGEN;
    const ids = comp.filteredBestellungen.map(b => b.id);
    expect(ids).toContain('1');
    expect(ids).toContain('3');
    expect(ids).not.toContain('2');
  });

  it('searchText filters by order id (case-insensitive)', () => {
    (comp as any).bestellungen.set([
      makeB('ABC123', BestellungsZustand.EINGEGANGEN),
      makeB('XYZ999', BestellungsZustand.EINGEGANGEN),
    ]);
    (comp as any).viewMode = 'alle';
    (comp as any).searchText = 'abc';
    expect(comp.filteredBestellungen.map(b => b.id)).toContain('ABC123');
    expect(comp.filteredBestellungen.map(b => b.id)).not.toContain('XYZ999');
  });
});

describe('AdminBestellungenOverview – canAdvance', () => {
  let comp: AdminBestellungenOverview;
  beforeEach(() => { comp = build(); });

  it('ANGEKOMMEN → false (no next state)', () => {
    expect(comp.canAdvance(makeB('1', BestellungsZustand.ANGEKOMMEN))).toBe(false);
  });

  it('STORNIERT → false (no next state)', () => {
    expect(comp.canAdvance(makeB('1', BestellungsZustand.STORNIERT))).toBe(false);
  });

  it('VERSANDT + any payment → true (delivery confirm always allowed)', () => {
    expect(comp.canAdvance(makeB('1', BestellungsZustand.VERSANDT, ZahlungsZustand.NOCH_AUSSTEHEND))).toBe(true);
    expect(comp.canAdvance(makeB('1', BestellungsZustand.VERSANDT, ZahlungsZustand.BEZAHLT))).toBe(true);
  });

  it('EINGEGANGEN + BEZAHLT → true', () => {
    expect(comp.canAdvance(makeB('1', BestellungsZustand.EINGEGANGEN, ZahlungsZustand.BEZAHLT))).toBe(true);
  });

  it('EINGEGANGEN + NOCH_AUSSTEHEND → false (payment required)', () => {
    expect(comp.canAdvance(makeB('1', BestellungsZustand.EINGEGANGEN, ZahlungsZustand.NOCH_AUSSTEHEND))).toBe(false);
  });

  it('IN_BEARBEITUNG + BEZAHLT → true', () => {
    expect(comp.canAdvance(makeB('1', BestellungsZustand.IN_BEARBEITUNG, ZahlungsZustand.BEZAHLT))).toBe(true);
  });

  it('IN_BEARBEITUNG + NOCH_AUSSTEHEND → false', () => {
    expect(comp.canAdvance(makeB('1', BestellungsZustand.IN_BEARBEITUNG, ZahlungsZustand.NOCH_AUSSTEHEND))).toBe(false);
  });
});

describe('AdminBestellungenOverview – getNextZustand', () => {
  let comp: AdminBestellungenOverview;
  beforeEach(() => { comp = build(); });

  it('EINGEGANGEN → IN_BEARBEITUNG', () => expect(comp.getNextZustand(makeB('1', BestellungsZustand.EINGEGANGEN))).toBe(BestellungsZustand.IN_BEARBEITUNG));
  it('IN_BEARBEITUNG → VERSANDT', () => expect(comp.getNextZustand(makeB('1', BestellungsZustand.IN_BEARBEITUNG))).toBe(BestellungsZustand.VERSANDT));
  it('VERSANDT → ANGEKOMMEN', () => expect(comp.getNextZustand(makeB('1', BestellungsZustand.VERSANDT))).toBe(BestellungsZustand.ANGEKOMMEN));
  it('ANGEKOMMEN → null', () => expect(comp.getNextZustand(makeB('1', BestellungsZustand.ANGEKOMMEN))).toBeNull());
  it('STORNIERT → null', () => expect(comp.getNextZustand(makeB('1', BestellungsZustand.STORNIERT))).toBeNull());
});

describe('AdminBestellungenOverview – isPaid / isNewOrder', () => {
  let comp: AdminBestellungenOverview;
  beforeEach(() => { comp = build(); });

  it('isPaid true when BEZAHLT', () => expect(comp.isPaid(makeB('1', BestellungsZustand.EINGEGANGEN, ZahlungsZustand.BEZAHLT))).toBe(true));
  it('isPaid false when NOCH_AUSSTEHEND', () => expect(comp.isPaid(makeB('1', BestellungsZustand.EINGEGANGEN, ZahlungsZustand.NOCH_AUSSTEHEND))).toBe(false));
  it('isNewOrder true for EINGEGANGEN', () => expect(comp.isNewOrder(makeB('1', BestellungsZustand.EINGEGANGEN))).toBe(true));
  it('isNewOrder false for other states', () => expect(comp.isNewOrder(makeB('1', BestellungsZustand.IN_BEARBEITUNG))).toBe(false));
});
