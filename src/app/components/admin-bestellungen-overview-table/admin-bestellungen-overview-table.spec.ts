import { TestBed } from '@angular/core/testing';
import { AdminBestellungenOverviewTable } from './admin-bestellungen-overview-table';
import { BestellungsZustand } from '../../models/enums/BestellungsZustand';

function build() {
  TestBed.configureTestingModule({ providers: [AdminBestellungenOverviewTable] });
  return TestBed.inject(AdminBestellungenOverviewTable);
}

describe('AdminBestellungenOverviewTable – getZustandLabel', () => {
  let comp: AdminBestellungenOverviewTable;
  beforeEach(() => { comp = build(); });

  it('EINGEGANGEN → "Eingegangen"',    () => expect(comp.getZustandLabel(BestellungsZustand.EINGEGANGEN)).toBe('Eingegangen'));
  it('IN_BEARBEITUNG → "In Bearbeitung"', () => expect(comp.getZustandLabel(BestellungsZustand.IN_BEARBEITUNG)).toBe('In Bearbeitung'));
  it('VERSANDT → "Versandt"',          () => expect(comp.getZustandLabel(BestellungsZustand.VERSANDT)).toBe('Versandt'));
  it('ANGEKOMMEN → "Angekommen"',      () => expect(comp.getZustandLabel(BestellungsZustand.ANGEKOMMEN)).toBe('Angekommen'));
  it('STORNIERT → "Storniert"',        () => expect(comp.getZustandLabel(BestellungsZustand.STORNIERT)).toBe('Storniert'));
  it('unknown value → "Unbekannt"',    () => expect(comp.getZustandLabel(99 as BestellungsZustand)).toBe('Unbekannt'));
});

describe('AdminBestellungenOverviewTable – getZustandClass', () => {
  let comp: AdminBestellungenOverviewTable;
  beforeEach(() => { comp = build(); });

  it('ANGEKOMMEN → badge--success',      () => expect(comp.getZustandClass(BestellungsZustand.ANGEKOMMEN)).toBe('badge--success'));
  it('VERSANDT → badge--neutral',        () => expect(comp.getZustandClass(BestellungsZustand.VERSANDT)).toBe('badge--neutral'));
  it('IN_BEARBEITUNG → badge--warning',  () => expect(comp.getZustandClass(BestellungsZustand.IN_BEARBEITUNG)).toBe('badge--warning'));
  it('STORNIERT → badge--error',         () => expect(comp.getZustandClass(BestellungsZustand.STORNIERT)).toBe('badge--error'));
  it('EINGEGANGEN → badge--neutral (default)', () => expect(comp.getZustandClass(BestellungsZustand.EINGEGANGEN)).toBe('badge--neutral'));
});

describe('AdminBestellungenOverviewTable – formatPrice', () => {
  let comp: AdminBestellungenOverviewTable;
  beforeEach(() => { comp = build(); });

  it('formats a valid price', () => {
    expect(comp.formatPrice(12.5)).toContain('12');
  });

  it('uses 0 as fallback when price is null/undefined', () => {
    expect(comp.formatPrice(null as any)).toContain('0');
    expect(comp.formatPrice(undefined as any)).toContain('0');
  });
});

describe('AdminBestellungenOverviewTable – getOrderTotal', () => {
  let comp: AdminBestellungenOverviewTable;
  beforeEach(() => { comp = build(); });

  it('sums preis * anzahl for all products', () => {
    const b: any = { produkte: [{ preis: 10, anzahl: 2 }, { preis: 5, anzahl: 3 }] };
    expect(comp.getOrderTotal(b)).toBe(35);
  });

  it('returns 0 for empty produkte array', () => {
    expect(comp.getOrderTotal({ produkte: [] } as any)).toBe(0);
  });

  it('returns 0 when produkte is null/undefined', () => {
    expect(comp.getOrderTotal({ produkte: null } as any)).toBe(0);
    expect(comp.getOrderTotal({} as any)).toBe(0);
  });

  it('uses 0 for missing preis or anzahl', () => {
    const b: any = { produkte: [{ preis: null, anzahl: 3 }, { preis: 10, anzahl: null }] };
    expect(comp.getOrderTotal(b)).toBe(0);
  });
});

describe('AdminBestellungenOverviewTable – formatDate', () => {
  let comp: AdminBestellungenOverviewTable;
  beforeEach(() => { comp = build(); });

  it('formats a Date object', () => {
    const result = comp.formatDate(new Date(2026, 3, 21));
    expect(result).toContain('21');
    expect(result).toContain('2026');
  });

  it('formats a Firestore Timestamp-like object (with toDate())', () => {
    const ts = { toDate: () => new Date(2026, 3, 21) };
    const result = comp.formatDate(ts);
    expect(result).toContain('21');
  });

  it('formats a date string', () => {
    const result = comp.formatDate('2026-04-21');
    expect(result).toContain('2026');
  });
});
