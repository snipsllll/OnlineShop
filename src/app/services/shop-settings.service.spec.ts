import { TestBed } from '@angular/core/testing';
import { ShopSettingsService, IRolePerms, IMitarbeiterPerms } from './shop-settings.service';

vi.mock('firebase/auth', () => ({
  // Call callback asynchronously so 'unsub' is assigned before the callback runs
  onAuthStateChanged: vi.fn((_auth: any, cb: any) => {
    Promise.resolve().then(() => cb(null));
    return () => {};
  }),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  Firestore: class {},
}));

vi.mock('../../environments/environment', () => ({
  auth: {},
  db: {},
  functions: {},
}));

import { setDoc } from 'firebase/firestore';

function buildService(): ShopSettingsService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(ShopSettingsService);
}

describe('ShopSettingsService – saveAdminPerms permission clamping', () => {
  it('keeps mitarbeiter perm when admin perm is true', async () => {
    const svc = buildService();
    svc.mitarbeiterPerms.set({ canManageProducts: true, canManageOrders: true, canViewUsers: true });

    const newAdminPerms: IRolePerms = {
      canManageProducts: true, canManageOrders: true, canViewUsers: true,
      canEditUsers: true, canManageShopSettings: true,
    };
    await svc.saveAdminPerms(newAdminPerms);

    expect(svc.mitarbeiterPerms()).toEqual({
      canManageProducts: true, canManageOrders: true, canViewUsers: true,
    });
  });

  it('clamps mitarbeiter perm to false when admin perm is revoked', async () => {
    const svc = buildService();
    svc.mitarbeiterPerms.set({ canManageProducts: true, canManageOrders: true, canViewUsers: true });

    const newAdminPerms: IRolePerms = {
      canManageProducts: false, canManageOrders: false, canViewUsers: false,
      canEditUsers: false, canManageShopSettings: false,
    };
    await svc.saveAdminPerms(newAdminPerms);

    expect(svc.mitarbeiterPerms()).toEqual({
      canManageProducts: false, canManageOrders: false, canViewUsers: false,
    });
  });

  it('partially clamps when only some admin perms are revoked', async () => {
    const svc = buildService();
    svc.mitarbeiterPerms.set({ canManageProducts: true, canManageOrders: true, canViewUsers: true });

    const newAdminPerms: IRolePerms = {
      canManageProducts: false, canManageOrders: true, canViewUsers: true,
      canEditUsers: false, canManageShopSettings: true,
    };
    await svc.saveAdminPerms(newAdminPerms);

    expect(svc.mitarbeiterPerms()).toEqual({
      canManageProducts: false, canManageOrders: true, canViewUsers: true,
    });
  });

  it('updates adminPerms signal after save', async () => {
    const svc = buildService();
    const newPerms: IRolePerms = {
      canManageProducts: false, canManageOrders: false, canViewUsers: false,
      canEditUsers: false, canManageShopSettings: false,
    };
    await svc.saveAdminPerms(newPerms);
    expect(svc.adminPerms()).toEqual(newPerms);
  });
/*
  it('calls setDoc when saving admin perms', async () => {
    const svc = buildService();
    vi.mocked(setDoc).mockClear();
    const perms: IRolePerms = {
      canManageProducts: true, canManageOrders: true, canViewUsers: true,
      canEditUsers: false, canManageShopSettings: true,
    };
    await svc.saveAdminPerms(perms);
    expect(setDoc).toHaveBeenCalled();
  });*/
});

describe('ShopSettingsService – saveMitarbeiterPerms clamping against admin', () => {
  it('strips perm that admin does not have', async () => {
    const svc = buildService();
    svc.adminPerms.set({
      canManageProducts: false, canManageOrders: true, canViewUsers: true,
      canEditUsers: false, canManageShopSettings: false,
    });

    await svc.saveMitarbeiterPerms({ canManageProducts: true, canManageOrders: true, canViewUsers: true });

    expect(svc.mitarbeiterPerms().canManageProducts).toBe(false);
    expect(svc.mitarbeiterPerms().canManageOrders).toBe(true);
    expect(svc.mitarbeiterPerms().canViewUsers).toBe(true);
  });

  it('allows perm when admin also has it', async () => {
    const svc = buildService();
    svc.adminPerms.set({
      canManageProducts: true, canManageOrders: true, canViewUsers: true,
      canEditUsers: true, canManageShopSettings: true,
    });

    await svc.saveMitarbeiterPerms({ canManageProducts: true, canManageOrders: true, canViewUsers: true });

    expect(svc.mitarbeiterPerms()).toEqual({ canManageProducts: true, canManageOrders: true, canViewUsers: true });
  });
});

describe('ShopSettingsService – saveMitarbeiterRoleEnabled', () => {
  it('updates mitarbeiterRoleEnabled signal', async () => {
    const svc = buildService();
    await svc.saveMitarbeiterRoleEnabled(false);
    expect(svc.mitarbeiterRoleEnabled()).toBe(false);
    await svc.saveMitarbeiterRoleEnabled(true);
    expect(svc.mitarbeiterRoleEnabled()).toBe(true);
  });
});
