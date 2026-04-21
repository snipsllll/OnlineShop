import { TestBed } from '@angular/core/testing';
import { BestellungenOverview } from './bestellungen-overview';
import { BestellungService } from '../../services/bestellung.service';
import { RoutingService } from '../../services/routing.service';
import { DialogService } from '../../services/dialog.service';
import { BestellungsZustand } from '../../models/enums/BestellungsZustand';

function build() {
  TestBed.configureTestingModule({
    providers: [
      BestellungenOverview,
      { provide: BestellungService, useValue: { getBestellungen: vi.fn().mockResolvedValue([]), editBestellung: vi.fn() } },
      { provide: RoutingService,    useValue: { route: vi.fn() } },
      { provide: DialogService,     useValue: { openConfirm: vi.fn() } },
    ],
  });
  return TestBed.inject(BestellungenOverview);
}

function makeBestellung(z: BestellungsZustand) {
  return { id: 'b1', bestellungsZustand: z, produkte: [], bestelldatum: new Date() } as any;
}

describe('BestellungenOverview – canCancel', () => {
  let comp: BestellungenOverview;
  beforeEach(() => { comp = build(); });

  it('EINGEGANGEN → true', () => expect(comp.canCancel(makeBestellung(BestellungsZustand.EINGEGANGEN))).toBe(true));
  it('IN_BEARBEITUNG → true', () => expect(comp.canCancel(makeBestellung(BestellungsZustand.IN_BEARBEITUNG))).toBe(true));
  it('VERSANDT → false', () => expect(comp.canCancel(makeBestellung(BestellungsZustand.VERSANDT))).toBe(false));
  it('ANGEKOMMEN → false', () => expect(comp.canCancel(makeBestellung(BestellungsZustand.ANGEKOMMEN))).toBe(false));
  it('STORNIERT → false', () => expect(comp.canCancel(makeBestellung(BestellungsZustand.STORNIERT))).toBe(false));
});

describe('BestellungenOverview – getZustandLabel', () => {
  let comp: BestellungenOverview;
  beforeEach(() => { comp = build(); });

  it('EINGEGANGEN → "Eingegangen"',      () => expect(comp.getZustandLabel(BestellungsZustand.EINGEGANGEN)).toBe('Eingegangen'));
  it('IN_BEARBEITUNG → "In Bearbeitung"', () => expect(comp.getZustandLabel(BestellungsZustand.IN_BEARBEITUNG)).toBe('In Bearbeitung'));
  it('VERSANDT → "Versandt"',            () => expect(comp.getZustandLabel(BestellungsZustand.VERSANDT)).toBe('Versandt'));
  it('ANGEKOMMEN → "Angekommen"',        () => expect(comp.getZustandLabel(BestellungsZustand.ANGEKOMMEN)).toBe('Angekommen'));
  it('STORNIERT → "Storniert"',          () => expect(comp.getZustandLabel(BestellungsZustand.STORNIERT)).toBe('Storniert'));
  it('unknown → "Unbekannt"',            () => expect(comp.getZustandLabel(99 as any)).toBe('Unbekannt'));
});

describe('BestellungenOverview – getZustandClass', () => {
  let comp: BestellungenOverview;
  beforeEach(() => { comp = build(); });

  it('ANGEKOMMEN → badge--success',      () => expect(comp.getZustandClass(BestellungsZustand.ANGEKOMMEN)).toBe('badge--success'));
  it('VERSANDT → badge--neutral',        () => expect(comp.getZustandClass(BestellungsZustand.VERSANDT)).toBe('badge--neutral'));
  it('IN_BEARBEITUNG → badge--warning',  () => expect(comp.getZustandClass(BestellungsZustand.IN_BEARBEITUNG)).toBe('badge--warning'));
  it('STORNIERT → badge--error',         () => expect(comp.getZustandClass(BestellungsZustand.STORNIERT)).toBe('badge--error'));
  it('EINGEGANGEN → badge--neutral',     () => expect(comp.getZustandClass(BestellungsZustand.EINGEGANGEN)).toBe('badge--neutral'));
});

describe('BestellungenOverview – getOrderTotal', () => {
  let comp: BestellungenOverview;
  beforeEach(() => { comp = build(); });

  it('sums preis * anzahl', () => {
    const b: any = { produkte: [{ preis: 15, anzahl: 2 }, { preis: 5, anzahl: 1 }] };
    expect(comp.getOrderTotal(b)).toBe(35);
  });

  // BUG: no null-check on b.produkte – throws TypeError when produkte is undefined
  it('BUG: throws when produkte is undefined (no null guard)', () => {
    const b: any = {};
    expect(() => comp.getOrderTotal(b)).toThrow();
  });
});
