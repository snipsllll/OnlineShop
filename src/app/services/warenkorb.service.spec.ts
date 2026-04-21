import { TestBed } from '@angular/core/testing';
import { WarenkorbService } from './warenkorb.service';
import { UserService } from './user.service';

vi.mock('../../environments/environment', () => ({
  auth: { currentUser: null },
  db: {},
  functions: {},
}));

import * as env from '../../environments/environment';

const GUEST_KEY = 'guest_warenkorb';

function makeUser(items: { produktId: string; anzahl: number }[] = []) {
  return {
    warenkorb: { id: 'u1', produkteMitAnzahl: items, gesamtPreis: 0 },
    uid: 'u1',
  };
}

function buildService(loggedIn: boolean, userItems: { produktId: string; anzahl: number }[] = []) {
  const user = makeUser(userItems);
  const userServiceMock = {
    getCurrentUser: vi.fn().mockResolvedValue(user),
    updateUser: vi.fn().mockResolvedValue(undefined),
  };
  // Toggle auth.currentUser to simulate login state
  (env.auth as any).currentUser = loggedIn ? { uid: 'u1' } : null;

  // Use direct instantiation — WarenkorbService uses constructor injection,
  // which requires emitDecoratorMetadata metadata that isn't available in Vitest.
  const service = new WarenkorbService(userServiceMock as any);
  return { service, userServiceMock, user };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  (env.auth as any).currentUser = null;
  localStorage.clear();
});

describe('WarenkorbService – guest cart (not logged in)', () => {
  it('getGuestCart returns empty cart when localStorage is empty', async () => {
    const { service } = buildService(false);
    const wk = await service.getWahrenkorb();
    expect(wk.produkteMitAnzahl).toEqual([]);
  });

  it('addToWarenkorb adds new item to guest cart', async () => {
    const { service } = buildService(false);
    await service.addToWarenkorb('p1', 2);
    const raw = JSON.parse(localStorage.getItem(GUEST_KEY)!);
    expect(raw.produkteMitAnzahl).toEqual([{ produktId: 'p1', anzahl: 2 }]);
  });

  it('addToWarenkorb increments existing item in guest cart', async () => {
    const { service } = buildService(false);
    await service.addToWarenkorb('p1', 2);
    await service.addToWarenkorb('p1', 3);
    const raw = JSON.parse(localStorage.getItem(GUEST_KEY)!);
    expect(raw.produkteMitAnzahl[0].anzahl).toBe(5);
  });

  it('removeFromWarenkorb removes item from guest cart', async () => {
    const { service } = buildService(false);
    await service.addToWarenkorb('p1', 1);
    await service.addToWarenkorb('p2', 1);
    await service.removeFromWarenkorb('p1');
    const raw = JSON.parse(localStorage.getItem(GUEST_KEY)!);
    expect(raw.produkteMitAnzahl).toEqual([{ produktId: 'p2', anzahl: 1 }]);
  });

  it('clearWarenkorb removes guest_warenkorb from localStorage', async () => {
    const { service } = buildService(false);
    await service.addToWarenkorb('p1', 1);
    await service.clearWarenkorb();
    expect(localStorage.getItem(GUEST_KEY)).toBeNull();
  });

  it('changeProduktAnzahl updates anzahl in guest cart', async () => {
    const { service } = buildService(false);
    await service.addToWarenkorb('p1', 1);
    await service.changeProduktAnzahl('p1', 10);
    const raw = JSON.parse(localStorage.getItem(GUEST_KEY)!);
    expect(raw.produkteMitAnzahl[0].anzahl).toBe(10);
  });
});

describe('WarenkorbService – logged-in cart', () => {
  it('addToWarenkorb adds new item when product not in cart', async () => {
    const { service, userServiceMock } = buildService(true, []);
    await service.addToWarenkorb('p1', 3);
    expect(userServiceMock.updateUser).toHaveBeenCalled();
    const updatedUser = userServiceMock.updateUser.mock.calls[0][0];
    expect(updatedUser.warenkorb.produkteMitAnzahl).toContainEqual({ produktId: 'p1', anzahl: 3 });
  });

  // BUG REPRODUCTION: logged-in addToWarenkorb does NOT increment existing items
  it('BUG: addToWarenkorb does NOT increment quantity for existing item (logged-in)', async () => {
    const { service, userServiceMock } = buildService(true, [{ produktId: 'p1', anzahl: 2 }]);
    await service.addToWarenkorb('p1', 3);
    // The bug: updateUser is never called because the item already exists
    expect(userServiceMock.updateUser).not.toHaveBeenCalled();
    // Quantity is still 2, not 5
    const user = await userServiceMock.getCurrentUser();
    expect(user.warenkorb.produkteMitAnzahl[0].anzahl).toBe(2);
  });

  it('removeFromWarenkorb removes item from logged-in cart', async () => {
    const { service, userServiceMock } = buildService(true, [
      { produktId: 'p1', anzahl: 1 },
      { produktId: 'p2', anzahl: 2 },
    ]);
    await service.removeFromWarenkorb('p1');
    const updatedUser = userServiceMock.updateUser.mock.calls[0][0];
    expect(updatedUser.warenkorb.produkteMitAnzahl).toEqual([{ produktId: 'p2', anzahl: 2 }]);
  });

  it('clearWarenkorb empties the logged-in cart', async () => {
    const { service, userServiceMock } = buildService(true, [{ produktId: 'p1', anzahl: 1 }]);
    await service.clearWarenkorb();
    const updatedUser = userServiceMock.updateUser.mock.calls[0][0];
    expect(updatedUser.warenkorb.produkteMitAnzahl).toEqual([]);
  });

  it('changeProduktAnzahl updates quantity in logged-in cart', async () => {
    const { service, userServiceMock } = buildService(true, [{ produktId: 'p1', anzahl: 1 }]);
    await service.changeProduktAnzahl('p1', 7);
    const updatedUser = userServiceMock.updateUser.mock.calls[0][0];
    expect(updatedUser.warenkorb.produkteMitAnzahl[0].anzahl).toBe(7);
  });
});

describe('WarenkorbService – mergeGuestCart', () => {
  it('does nothing when localStorage has no guest cart', async () => {
    const { service, userServiceMock } = buildService(true);
    await service.mergeGuestCart();
    expect(userServiceMock.updateUser).not.toHaveBeenCalled();
  });

  it('merges guest items into logged-in cart (new products)', async () => {
    const { service, userServiceMock } = buildService(true, []);
    localStorage.setItem(GUEST_KEY, JSON.stringify({ produkteMitAnzahl: [{ produktId: 'g1', anzahl: 2 }] }));
    await service.mergeGuestCart();
    const updatedUser = userServiceMock.updateUser.mock.calls[0][0];
    expect(updatedUser.warenkorb.produkteMitAnzahl).toContainEqual({ produktId: 'g1', anzahl: 2 });
  });

  it('sums quantities when product exists in both carts', async () => {
    const { service, userServiceMock } = buildService(true, [{ produktId: 'p1', anzahl: 3 }]);
    localStorage.setItem(GUEST_KEY, JSON.stringify({ produkteMitAnzahl: [{ produktId: 'p1', anzahl: 5 }] }));
    await service.mergeGuestCart();
    const updatedUser = userServiceMock.updateUser.mock.calls[0][0];
    const merged = updatedUser.warenkorb.produkteMitAnzahl.find((p: any) => p.produktId === 'p1');
    expect(merged.anzahl).toBe(8);
  });

  it('clears guest cart from localStorage after merge', async () => {
    const { service } = buildService(true, []);
    localStorage.setItem(GUEST_KEY, JSON.stringify({ produkteMitAnzahl: [{ produktId: 'g1', anzahl: 1 }] }));
    await service.mergeGuestCart();
    expect(localStorage.getItem(GUEST_KEY)).toBeNull();
  });

  it('handles corrupted localStorage data gracefully', async () => {
    const { service, userServiceMock } = buildService(true);
    localStorage.setItem(GUEST_KEY, 'INVALID_JSON');
    await service.mergeGuestCart();
    expect(userServiceMock.updateUser).not.toHaveBeenCalled();
    expect(localStorage.getItem(GUEST_KEY)).toBeNull();
  });
});
