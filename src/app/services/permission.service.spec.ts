import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PermissionService } from './permission.service';
import { AuthService } from './auth.service';
import { ShopSettingsService } from './shop-settings.service';
import { Rolle } from '../models/enums/Rolle';

const DEFAULT_PERMS = {
  canManageProducts: true,
  canManageOrders: true,
  canViewUsers: true,
  canEditUsers: true,
  canManageShopSettings: true,
};

function makeAuthMock(rolle: Rolle) {
  return { currentRolle: signal(rolle), isLoggedIn: signal(true) };
}

function makeSettingsMock(mitEnabled: boolean, adminPerms = DEFAULT_PERMS, mitPerms = DEFAULT_PERMS) {
  return {
    mitarbeiterRoleEnabled: signal(mitEnabled),
    adminPerms: signal(adminPerms),
    mitarbeiterPerms: signal(mitPerms),
  };
}

function buildService(rolle: Rolle, mitEnabled = true, adminPerms = DEFAULT_PERMS, mitPerms = DEFAULT_PERMS) {
  TestBed.configureTestingModule({
    providers: [
      PermissionService,
      { provide: AuthService, useValue: makeAuthMock(rolle) },
      { provide: ShopSettingsService, useValue: makeSettingsMock(mitEnabled, adminPerms, mitPerms) },
    ],
  });
  return TestBed.inject(PermissionService);
}

describe('PermissionService – canAccessAdminPanel', () => {
  it('OWNER → true', () => expect(buildService(Rolle.OWNER).canAccessAdminPanel()).toBe(true));
  it('ADMIN → true', () => expect(buildService(Rolle.ADMIN).canAccessAdminPanel()).toBe(true));
  it('MITARBEITER + mitEnabled → true', () => expect(buildService(Rolle.MITARBEITER, true).canAccessAdminPanel()).toBe(true));
  it('MITARBEITER + mitDisabled → false', () => expect(buildService(Rolle.MITARBEITER, false).canAccessAdminPanel()).toBe(false));
  it('KUNDE → false', () => expect(buildService(Rolle.KUNDE).canAccessAdminPanel()).toBe(false));
});

describe('PermissionService – canManageProducts', () => {
  it('OWNER → always true', () => expect(buildService(Rolle.OWNER).canManageProducts()).toBe(true));
  it('ADMIN with perm true → true', () => expect(buildService(Rolle.ADMIN, true, { ...DEFAULT_PERMS, canManageProducts: true }).canManageProducts()).toBe(true));
  it('ADMIN with perm false → false', () => expect(buildService(Rolle.ADMIN, true, { ...DEFAULT_PERMS, canManageProducts: false }).canManageProducts()).toBe(false));
  it('MITARBEITER enabled + perm true → true', () => expect(buildService(Rolle.MITARBEITER, true, DEFAULT_PERMS, { ...DEFAULT_PERMS, canManageProducts: true }).canManageProducts()).toBe(true));
  it('MITARBEITER enabled + perm false → false', () => expect(buildService(Rolle.MITARBEITER, true, DEFAULT_PERMS, { ...DEFAULT_PERMS, canManageProducts: false }).canManageProducts()).toBe(false));
  it('MITARBEITER disabled → false regardless of perm', () => expect(buildService(Rolle.MITARBEITER, false).canManageProducts()).toBe(false));
  it('KUNDE → false', () => expect(buildService(Rolle.KUNDE).canManageProducts()).toBe(false));
});

describe('PermissionService – canManageOrders', () => {
  it('OWNER → true', () => expect(buildService(Rolle.OWNER).canManageOrders()).toBe(true));
  it('ADMIN perm true → true', () => expect(buildService(Rolle.ADMIN, true, { ...DEFAULT_PERMS, canManageOrders: true }).canManageOrders()).toBe(true));
  it('ADMIN perm false → false', () => expect(buildService(Rolle.ADMIN, true, { ...DEFAULT_PERMS, canManageOrders: false }).canManageOrders()).toBe(false));
  it('MITARBEITER enabled + perm true → true', () => expect(buildService(Rolle.MITARBEITER, true, DEFAULT_PERMS, { ...DEFAULT_PERMS, canManageOrders: true }).canManageOrders()).toBe(true));
  it('MITARBEITER disabled → false', () => expect(buildService(Rolle.MITARBEITER, false).canManageOrders()).toBe(false));
  it('KUNDE → false', () => expect(buildService(Rolle.KUNDE).canManageOrders()).toBe(false));
});

describe('PermissionService – canViewUsers', () => {
  it('OWNER → true', () => expect(buildService(Rolle.OWNER).canViewUsers()).toBe(true));
  it('ADMIN perm true → true', () => expect(buildService(Rolle.ADMIN, true, { ...DEFAULT_PERMS, canViewUsers: true }).canViewUsers()).toBe(true));
  it('ADMIN perm false → false', () => expect(buildService(Rolle.ADMIN, true, { ...DEFAULT_PERMS, canViewUsers: false }).canViewUsers()).toBe(false));
  it('MITARBEITER enabled + perm true → true', () => expect(buildService(Rolle.MITARBEITER, true, DEFAULT_PERMS, { ...DEFAULT_PERMS, canViewUsers: true }).canViewUsers()).toBe(true));
  it('MITARBEITER disabled → false', () => expect(buildService(Rolle.MITARBEITER, false).canViewUsers()).toBe(false));
  it('KUNDE → false', () => expect(buildService(Rolle.KUNDE).canViewUsers()).toBe(false));
});

describe('PermissionService – canEditUsers', () => {
  it('OWNER → true', () => expect(buildService(Rolle.OWNER).canEditUsers()).toBe(true));
  it('ADMIN perm true → true', () => expect(buildService(Rolle.ADMIN, true, { ...DEFAULT_PERMS, canEditUsers: true }).canEditUsers()).toBe(true));
  it('ADMIN perm false → false', () => expect(buildService(Rolle.ADMIN, true, { ...DEFAULT_PERMS, canEditUsers: false }).canEditUsers()).toBe(false));
  it('MITARBEITER → always false (no perm for this)', () => expect(buildService(Rolle.MITARBEITER, true).canEditUsers()).toBe(false));
  it('KUNDE → false', () => expect(buildService(Rolle.KUNDE).canEditUsers()).toBe(false));
});

describe('PermissionService – canManageShopSettings', () => {
  it('OWNER → true', () => expect(buildService(Rolle.OWNER).canManageShopSettings()).toBe(true));
  it('ADMIN perm true → true', () => expect(buildService(Rolle.ADMIN, true, { ...DEFAULT_PERMS, canManageShopSettings: true }).canManageShopSettings()).toBe(true));
  it('ADMIN perm false → false', () => expect(buildService(Rolle.ADMIN, true, { ...DEFAULT_PERMS, canManageShopSettings: false }).canManageShopSettings()).toBe(false));
  it('MITARBEITER → false', () => expect(buildService(Rolle.MITARBEITER, true).canManageShopSettings()).toBe(false));
  it('KUNDE → false', () => expect(buildService(Rolle.KUNDE).canManageShopSettings()).toBe(false));
});

describe('PermissionService – canEditCustomerData / canAccessOwnerSettings', () => {
  it('OWNER → both true', () => {
    const s = buildService(Rolle.OWNER);
    expect(s.canEditCustomerData()).toBe(true);
    expect(s.canAccessOwnerSettings()).toBe(true);
  });
  it('ADMIN → both false', () => {
    const s = buildService(Rolle.ADMIN);
    expect(s.canEditCustomerData()).toBe(false);
    expect(s.canAccessOwnerSettings()).toBe(false);
  });
  it('KUNDE → both false', () => {
    const s = buildService(Rolle.KUNDE);
    expect(s.canEditCustomerData()).toBe(false);
    expect(s.canAccessOwnerSettings()).toBe(false);
  });
});

describe('PermissionService – assignableRoles', () => {
  it('OWNER + mitEnabled → [KUNDE, MITARBEITER, ADMIN, OWNER]', () => {
    expect(buildService(Rolle.OWNER, true).assignableRoles()).toEqual([Rolle.KUNDE, Rolle.MITARBEITER, Rolle.ADMIN, Rolle.OWNER]);
  });
  it('OWNER + mitDisabled → [KUNDE, ADMIN, OWNER]', () => {
    expect(buildService(Rolle.OWNER, false).assignableRoles()).toEqual([Rolle.KUNDE, Rolle.ADMIN, Rolle.OWNER]);
  });
  it('ADMIN + mitEnabled → [KUNDE, MITARBEITER]', () => {
    expect(buildService(Rolle.ADMIN, true).assignableRoles()).toEqual([Rolle.KUNDE, Rolle.MITARBEITER]);
  });
  it('ADMIN + mitDisabled → [KUNDE]', () => {
    expect(buildService(Rolle.ADMIN, false).assignableRoles()).toEqual([Rolle.KUNDE]);
  });
  it('MITARBEITER → []', () => {
    expect(buildService(Rolle.MITARBEITER, true).assignableRoles()).toEqual([]);
  });
  it('KUNDE → []', () => {
    expect(buildService(Rolle.KUNDE).assignableRoles()).toEqual([]);
  });
});
