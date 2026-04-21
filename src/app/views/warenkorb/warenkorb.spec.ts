import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Warenkorb } from './warenkorb';
import { WarenkorbService } from '../../services/warenkorb.service';
import { ProduktService } from '../../services/produkt.service';
import { AuthService } from '../../services/auth.service';
import { RoutingService } from '../../services/routing.service';

function buildComponent() {
  const authMock = { isLoggedIn: signal(false) };
  const warenkorbMock = {
    getWahrenkorb: vi.fn().mockResolvedValue({ produkteMitAnzahl: [] }),
    changeProduktAnzahl: vi.fn().mockResolvedValue(undefined),
    removeFromWarenkorb: vi.fn().mockResolvedValue(undefined),
  };

  TestBed.configureTestingModule({
    providers: [
      Warenkorb,
      { provide: WarenkorbService, useValue: warenkorbMock },
      { provide: ProduktService,   useValue: { getProdukte: vi.fn().mockResolvedValue([]) } },
      { provide: AuthService,      useValue: authMock },
      { provide: RoutingService,   useValue: { route: vi.fn() } },
    ],
  });

  return { comp: TestBed.inject(Warenkorb), warenkorbMock };
}

describe('Warenkorb – gesamtpreis', () => {
  it('calculates sum of preis * anzahl', () => {
    const { comp } = buildComponent();
    (comp as any).cartItems.set([
      { produkt: { id: 'p1', preis: 20 }, anzahl: 2 },
      { produkt: { id: 'p2', preis: 5 }, anzahl: 4 },
    ]);
    expect(comp.gesamtpreis).toBe(60);
  });

  it('returns 0 for empty cart', () => {
    const { comp } = buildComponent();
    (comp as any).cartItems.set([]);
    expect(comp.gesamtpreis).toBe(0);
  });
});

describe('Warenkorb – updateAnzahl', () => {
  it('ignores anzahl < 1 (guard)', async () => {
    const { comp, warenkorbMock } = buildComponent();
    await comp.updateAnzahl('p1', 0);
    expect(warenkorbMock.changeProduktAnzahl).not.toHaveBeenCalled();

    await comp.updateAnzahl('p1', -5);
    expect(warenkorbMock.changeProduktAnzahl).not.toHaveBeenCalled();
  });

  it('calls changeProduktAnzahl for valid anzahl', async () => {
    const { comp, warenkorbMock } = buildComponent();
    (comp as any).cartItems.set([{ produkt: { id: 'p1', preis: 10 }, anzahl: 1 }]);
    await comp.updateAnzahl('p1', 3);
    expect(warenkorbMock.changeProduktAnzahl).toHaveBeenCalledWith('p1', 3);
  });

  it('updates cartItems signal after change', async () => {
    const { comp } = buildComponent();
    (comp as any).cartItems.set([{ produkt: { id: 'p1', preis: 10 }, anzahl: 1 }]);
    await comp.updateAnzahl('p1', 5);
    expect((comp as any).cartItems()[0].anzahl).toBe(5);
  });
});

describe('Warenkorb – removeItem', () => {
  it('calls removeFromWarenkorb', async () => {
    const { comp, warenkorbMock } = buildComponent();
    (comp as any).cartItems.set([{ produkt: { id: 'p1', preis: 10 }, anzahl: 1 }]);
    await comp.removeItem('p1');
    expect(warenkorbMock.removeFromWarenkorb).toHaveBeenCalledWith('p1');
  });

  it('removes item from cartItems signal', async () => {
    const { comp } = buildComponent();
    (comp as any).cartItems.set([
      { produkt: { id: 'p1', preis: 10 }, anzahl: 1 },
      { produkt: { id: 'p2', preis: 5 }, anzahl: 2 },
    ]);
    await comp.removeItem('p1');
    expect((comp as any).cartItems().map((i: any) => i.produkt.id)).toEqual(['p2']);
  });
});
