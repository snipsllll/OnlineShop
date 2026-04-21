import { TestBed } from '@angular/core/testing';
import { BestellungDetails } from './bestellung-details';
import { BestellungService } from '../../services/bestellung.service';
import { RoutingService } from '../../services/routing.service';
import { DialogService } from '../../services/dialog.service';
import { ActivatedRoute } from '@angular/router';
import { BestellungsZustand } from '../../models/enums/BestellungsZustand';

function build() {
  TestBed.configureTestingModule({
    providers: [
      BestellungDetails,
      { provide: BestellungService, useValue: { getBestellung: vi.fn(), editBestellung: vi.fn() } },
      { provide: RoutingService,    useValue: { route: vi.fn() } },
      { provide: DialogService,     useValue: { openConfirm: vi.fn() } },
      { provide: ActivatedRoute,    useValue: { snapshot: { paramMap: { get: vi.fn().mockReturnValue(null) } } } },
    ],
  });
  return TestBed.inject(BestellungDetails);
}

function setBestellung(comp: BestellungDetails, z: BestellungsZustand, produkte: any[] = []) {
  (comp as any).bestellung.set({ id: 'b1', bestellungsZustand: z, produkte });
}

describe('BestellungDetails – canCancel', () => {
  let comp: BestellungDetails;
  beforeEach(() => { comp = build(); });

  it('EINGEGANGEN → true', () => { setBestellung(comp, BestellungsZustand.EINGEGANGEN); expect(comp.canCancel()).toBe(true); });
  it('IN_BEARBEITUNG → true', () => { setBestellung(comp, BestellungsZustand.IN_BEARBEITUNG); expect(comp.canCancel()).toBe(true); });
  it('VERSANDT → false', () => { setBestellung(comp, BestellungsZustand.VERSANDT); expect(comp.canCancel()).toBe(false); });
  it('ANGEKOMMEN → false', () => { setBestellung(comp, BestellungsZustand.ANGEKOMMEN); expect(comp.canCancel()).toBe(false); });
  it('STORNIERT → false', () => { setBestellung(comp, BestellungsZustand.STORNIERT); expect(comp.canCancel()).toBe(false); });
  it('null bestellung → false', () => { (comp as any).bestellung.set(null); expect(comp.canCancel()).toBe(false); });
});

describe('BestellungDetails – total getter', () => {
  let comp: BestellungDetails;
  beforeEach(() => { comp = build(); });

  it('sums preis * anzahl', () => {
    setBestellung(comp, BestellungsZustand.EINGEGANGEN, [{ preis: 10, anzahl: 3 }, { preis: 5, anzahl: 2 }]);
    expect(comp.total).toBe(40);
  });

  it('returns 0 when bestellung is null', () => {
    (comp as any).bestellung.set(null);
    expect(comp.total).toBe(0);
  });

  it('returns 0 for empty produkte', () => {
    setBestellung(comp, BestellungsZustand.EINGEGANGEN, []);
    expect(comp.total).toBe(0);
  });
});

describe('BestellungDetails – getZustandLabel', () => {
  let comp: BestellungDetails;
  beforeEach(() => { comp = build(); });

  it('all 5 states return correct labels', () => {
    expect(comp.getZustandLabel(BestellungsZustand.EINGEGANGEN)).toBe('Eingegangen');
    expect(comp.getZustandLabel(BestellungsZustand.IN_BEARBEITUNG)).toBe('In Bearbeitung');
    expect(comp.getZustandLabel(BestellungsZustand.VERSANDT)).toBe('Versandt');
    expect(comp.getZustandLabel(BestellungsZustand.ANGEKOMMEN)).toBe('Angekommen');
    expect(comp.getZustandLabel(BestellungsZustand.STORNIERT)).toBe('Storniert');
  });

  it('unknown → "Unbekannt"', () => expect(comp.getZustandLabel(99 as any)).toBe('Unbekannt'));
});
