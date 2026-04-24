import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Checkout } from './checkout';
import { WarenkorbService } from '../../services/warenkorb.service';
import { ProduktService } from '../../services/produkt.service';
import { BestellungService } from '../../services/bestellung.service';
import { RoutingService } from '../../services/routing.service';
import { UserService } from '../../services/user.service';
import { ShopSettingsService } from '../../services/shop-settings.service';
import { AuthService } from '../../services/auth.service';
import { DialogService } from '../../services/dialog.service';

function buildComponent(devBannerEnabled = false) {
  const settingsMock = { devBannerEnabled: signal(devBannerEnabled) };

  TestBed.configureTestingModule({
    providers: [
      Checkout,
      { provide: WarenkorbService,  useValue: { getWahrenkorb: vi.fn().mockResolvedValue({ produkteMitAnzahl: [] }), clearWarenkorb: vi.fn() } },
      { provide: ProduktService,    useValue: { getProdukte: vi.fn().mockResolvedValue([]) } },
      { provide: BestellungService, useValue: { addBestellung: vi.fn().mockResolvedValue('id1') } },
      { provide: RoutingService,    useValue: { route: vi.fn() } },
      { provide: UserService,       useValue: { getCurrentUser: vi.fn().mockResolvedValue({}) } },
      { provide: ShopSettingsService, useValue: settingsMock },
      { provide: AuthService,       useValue: { isLoggedIn: signal(true), currentUid: signal('uid1') } },
      { provide: DialogService,     useValue: { openLogin: vi.fn() } },
    ],
  });

  return { comp: TestBed.inject(Checkout), settingsMock };
}

describe('Checkout – isFormValid', () => {
  it('returns true when all fields are filled', () => {
    const { comp } = buildComponent();
    (comp as any).adresse = { vorname: 'Max', nachname: 'Muster', strasse: 'Musterstr', hausnummer: '1', plz: '12345', ort: 'Berlin', land: 'Deutschland' };
    expect(comp.isFormValid).toBe(true);
  });

  it('returns false when strasse is missing', () => {
    const { comp } = buildComponent();
    (comp as any).adresse = { strasse: '', hausnummer: '1', plz: '12345', ort: 'Berlin', land: 'Deutschland' };
    expect(comp.isFormValid).toBe(false);
  });

  it('returns false when hausnummer is missing', () => {
    const { comp } = buildComponent();
    (comp as any).adresse = { strasse: 'Musterstr', hausnummer: '', plz: '12345', ort: 'Berlin', land: 'Deutschland' };
    expect(comp.isFormValid).toBe(false);
  });

  it('returns false when plz is missing', () => {
    const { comp } = buildComponent();
    (comp as any).adresse = { strasse: 'Musterstr', hausnummer: '1', plz: '', ort: 'Berlin', land: 'Deutschland' };
    expect(comp.isFormValid).toBe(false);
  });

  it('returns false when ort is missing', () => {
    const { comp } = buildComponent();
    (comp as any).adresse = { strasse: 'Musterstr', hausnummer: '1', plz: '12345', ort: '', land: 'Deutschland' };
    expect(comp.isFormValid).toBe(false);
  });

  it('returns false when land is missing', () => {
    const { comp } = buildComponent();
    (comp as any).adresse = { strasse: 'Musterstr', hausnummer: '1', plz: '12345', ort: 'Berlin', land: '' };
    expect(comp.isFormValid).toBe(false);
  });
});

describe('Checkout – gesamtpreis', () => {
  it('calculates total correctly', () => {
    const { comp } = buildComponent();
    (comp as any).cartProdukte.set([
      { produkt: { preis: 10 }, anzahl: 2 },
      { produkt: { preis: 5 }, anzahl: 3 },
    ]);
    expect(comp.gesamtpreis).toBe(35);
  });

  it('returns 0 for empty cart', () => {
    const { comp } = buildComponent();
    (comp as any).cartProdukte.set([]);
    expect(comp.gesamtpreis).toBe(0);
  });
});

describe('Checkout – submitOrder zahlungsZustand', () => {
  it('sets BEZAHLT when devBannerEnabled is true', async () => {
    const { comp } = buildComponent(true);
    (comp as any).cartProdukte.set([{ produkt: { id: 'p1', bezeichnung: 'P', preis: 10 }, anzahl: 1 }]);
    (comp as any).adresse = { strasse: 'S', hausnummer: '1', plz: '12345', ort: 'Berlin', land: 'Deutschland' };

    const bestellungService = TestBed.inject(BestellungService);
    await comp.submitOrder();

    const bestellung = (bestellungService.addBestellung as any).mock.calls[0][0];
    expect(bestellung.zahlungsZustand).toBe(0); // ZahlungsZustand.BEZAHLT = 0
  });

  it('sets NOCH_AUSSTEHEND when devBannerEnabled is false', async () => {
    const { comp } = buildComponent(false);
    (comp as any).cartProdukte.set([{ produkt: { id: 'p1', bezeichnung: 'P', preis: 10 }, anzahl: 1 }]);
    (comp as any).adresse = { strasse: 'S', hausnummer: '1', plz: '12345', ort: 'Berlin', land: 'Deutschland' };

    const bestellungService = TestBed.inject(BestellungService);
    await comp.submitOrder();

    const bestellung = (bestellungService.addBestellung as any).mock.calls[0][0];
    expect(bestellung.zahlungsZustand).toBe(1); // ZahlungsZustand.NOCH_AUSSTEHEND = 1
  });
});
