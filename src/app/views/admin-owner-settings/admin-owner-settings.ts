import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AdminNav} from '../../components/admin-nav/admin-nav';
import {AuthService} from '../../services/auth.service';
import {UserService} from '../../services/user.service';
import {RoutingService} from '../../services/routing.service';
import {ShopSettingsService} from '../../services/shop-settings.service';
import {IUser} from '../../models/interfaces/IUser';
import {Rolle} from '../../models/enums/Rolle';
import {MyRoutes} from '../../models/enums/MyRoutes';

@Component({
  selector: 'app-admin-owner-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav],
  templateUrl: './admin-owner-settings.html',
  styleUrl: './admin-owner-settings.css',
})
export class AdminOwnerSettings implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private routingService = inject(RoutingService);
  protected settings = inject(ShopSettingsService);

  protected loading = signal(true);
  protected elevatedUsers = signal<IUser[]>([]);
  protected mitarbeiterUserCount = signal(0);
  protected readonly Rolle = Rolle;

  // Dev Banner
  protected devBannerEnabled = false;
  protected bannerSaving = signal(false);
  protected bannerSaveSuccess = signal(false);
  protected bannerSaveError = signal(false);

  // Admin Permissions
  protected adminPermsLocal = { canManageProducts: true, canManageOrders: true, canViewUsers: true, canManageShopSettings: true };
  protected adminPermsSaving = signal(false);
  protected adminPermsSaveSuccess = signal(false);
  protected adminPermsSaveError = signal(false);

  // Mitarbeiter Role
  protected mitarbeiterRoleEnabledLocal = true;
  protected mitarbeiterRoleSaving = signal(false);
  protected mitarbeiterRoleSaveSuccess = signal(false);
  protected mitarbeiterRoleSaveError = signal(false);

  constructor() {
    effect(() => {
      if (!this.settings.initialized()) return;
      this.devBannerEnabled = this.settings.devBannerEnabled();
      this.adminPermsLocal = {...this.settings.adminPerms()};
      this.mitarbeiterRoleEnabledLocal = this.settings.mitarbeiterRoleEnabled();
    });
  }

  async saveBanner() {
    this.bannerSaving.set(true);
    this.bannerSaveError.set(false);
    try {
      await this.settings.save(this.devBannerEnabled, this.settings.shopName());
      this.bannerSaveSuccess.set(true);
      setTimeout(() => this.bannerSaveSuccess.set(false), 3000);
    } catch {
      this.bannerSaveError.set(true);
      setTimeout(() => this.bannerSaveError.set(false), 4000);
    } finally {
      this.bannerSaving.set(false);
    }
  }

  async saveAdminPerms() {
    this.adminPermsSaving.set(true);
    this.adminPermsSaveError.set(false);
    try {
      await this.settings.saveAdminPerms({...this.adminPermsLocal});
      this.adminPermsSaveSuccess.set(true);
      setTimeout(() => this.adminPermsSaveSuccess.set(false), 3000);
    } catch {
      this.adminPermsSaveError.set(true);
      setTimeout(() => this.adminPermsSaveError.set(false), 4000);
    } finally {
      this.adminPermsSaving.set(false);
    }
  }

  protected readonly permRows: { label: string; kunde: boolean; mitarbeiter: boolean; admin: boolean }[] = [
    { label: 'Shop durchsuchen & kaufen',       kunde: true,  mitarbeiter: true,  admin: true  },
    { label: 'Admin-Panel sehen',               kunde: false, mitarbeiter: true,  admin: true  },
    { label: 'Produkte verwalten',              kunde: false, mitarbeiter: true,  admin: true  },
    { label: 'Bestellungen verwalten',          kunde: false, mitarbeiter: true,  admin: true  },
    { label: 'Benutzerliste einsehen',          kunde: false, mitarbeiter: true,  admin: true  },
    { label: 'Kundendaten bearbeiten',          kunde: false, mitarbeiter: false, admin: false },
    { label: 'Shop-Einstellungen ändern',       kunde: false, mitarbeiter: false, admin: true  },
    { label: 'Owner-Einstellungen',             kunde: false, mitarbeiter: false, admin: false },
    { label: 'Rollen vergeben (inkl. Owner)',   kunde: false, mitarbeiter: false, admin: false },
  ];

  async ngOnInit() {
    // Redirect if not owner
    if (this.authService.authInitialized() && this.authService.currentRolle() !== Rolle.OWNER) {
      this.routingService.route(MyRoutes.ADMIN_DASHBOARD);
      return;
    }

    this.loading.set(true);
    try {
      const all = await this.userService.getAllUsers();
      this.elevatedUsers.set(
        all.filter(u => u.rolle === Rolle.OWNER || u.rolle === Rolle.ADMIN)
           .sort((a, b) => a.rolle - b.rolle)
      );
      this.mitarbeiterUserCount.set(all.filter(u => u.rolle === Rolle.MITARBEITER).length);
    } finally {
      this.loading.set(false);
    }
  }

  async saveMitarbeiterRoleEnabled() {
    this.mitarbeiterRoleSaving.set(true);
    this.mitarbeiterRoleSaveError.set(false);
    try {
      await this.settings.saveMitarbeiterRoleEnabled(this.mitarbeiterRoleEnabledLocal);
      this.mitarbeiterRoleSaveSuccess.set(true);
      setTimeout(() => this.mitarbeiterRoleSaveSuccess.set(false), 3000);
    } catch {
      this.mitarbeiterRoleSaveError.set(true);
      setTimeout(() => this.mitarbeiterRoleSaveError.set(false), 4000);
    } finally {
      this.mitarbeiterRoleSaving.set(false);
    }
  }

  getRolleLabel(r: Rolle): string {
    return r === Rolle.OWNER ? 'Owner' : 'Admin';
  }

  getRolleClass(r: Rolle): string {
    return r === Rolle.OWNER ? 'badge--owner' : 'badge--error';
  }

  goToUsers() { this.routingService.route(MyRoutes.ADMIN_USERS); }
}
