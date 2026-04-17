import {computed, inject, Injectable} from '@angular/core';
import {AuthService} from './auth.service';
import {ShopSettingsService} from './shop-settings.service';
import {Rolle} from '../models/enums/Rolle';

@Injectable({providedIn: 'root'})
export class PermissionService {
  private auth = inject(AuthService);
  private settings = inject(ShopSettingsService);

  private get mitarbeiterActive(): boolean {
    return this.settings.mitarbeiterRoleEnabled();
  }

  readonly canAccessAdminPanel = computed(() => {
    const r = this.auth.currentRolle();
    if (r === Rolle.OWNER || r === Rolle.ADMIN) return true;
    if (r === Rolle.MITARBEITER) return this.settings.mitarbeiterRoleEnabled();
    return false;
  });

  readonly canManageProducts = computed(() => {
    const r = this.auth.currentRolle();
    if (r === Rolle.OWNER) return true;
    if (r === Rolle.ADMIN) return this.settings.adminPerms().canManageProducts;
    if (r === Rolle.MITARBEITER) return this.settings.mitarbeiterRoleEnabled() && this.settings.mitarbeiterPerms().canManageProducts;
    return false;
  });

  readonly canManageOrders = computed(() => {
    const r = this.auth.currentRolle();
    if (r === Rolle.OWNER) return true;
    if (r === Rolle.ADMIN) return this.settings.adminPerms().canManageOrders;
    if (r === Rolle.MITARBEITER) return this.settings.mitarbeiterRoleEnabled() && this.settings.mitarbeiterPerms().canManageOrders;
    return false;
  });

  readonly canViewUsers = computed(() => {
    const r = this.auth.currentRolle();
    if (r === Rolle.OWNER) return true;
    if (r === Rolle.ADMIN) return this.settings.adminPerms().canViewUsers;
    if (r === Rolle.MITARBEITER) return this.settings.mitarbeiterRoleEnabled() && this.settings.mitarbeiterPerms().canViewUsers;
    return false;
  });

  readonly canManageShopSettings = computed(() => {
    const r = this.auth.currentRolle();
    if (r === Rolle.OWNER) return true;
    if (r === Rolle.ADMIN) return this.settings.adminPerms().canManageShopSettings;
    return false;
  });

  readonly canEditCustomerData = computed(() => this.auth.currentRolle() === Rolle.OWNER);
  readonly canAccessOwnerSettings = computed(() => this.auth.currentRolle() === Rolle.OWNER);

  /** Which roles the current user may assign to others */
  readonly assignableRoles = computed((): Rolle[] => {
    const r = this.auth.currentRolle();
    const mitEnabled = this.settings.mitarbeiterRoleEnabled();
    if (r === Rolle.OWNER) return mitEnabled
      ? [Rolle.KUNDE, Rolle.MITARBEITER, Rolle.ADMIN, Rolle.OWNER]
      : [Rolle.KUNDE, Rolle.ADMIN, Rolle.OWNER];
    if (r === Rolle.ADMIN) return mitEnabled ? [Rolle.KUNDE, Rolle.MITARBEITER] : [Rolle.KUNDE];
    return [];
  });
}
