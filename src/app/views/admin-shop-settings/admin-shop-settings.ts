import {Component, effect, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ShopSettingsService} from '../../services/shop-settings.service';
import {AdminNav} from '../../components/admin-nav/admin-nav';
import {IMitarbeiterPerms} from '../../services/shop-settings.service';

@Component({
  selector: 'app-admin-shop-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav],
  templateUrl: './admin-shop-settings.html',
  styleUrl: './admin-shop-settings.css',
})
export class AdminShopSettings {
  protected settings = inject(ShopSettingsService);

  protected shopName = '';
  protected saving = signal(false);
  protected saveSuccess = signal(false);
  protected saveError = signal(false);

  // Mitarbeiter permissions
  protected mitarbeiterPermsLocal: IMitarbeiterPerms = { canManageProducts: false, canManageOrders: false, canViewUsers: false };
  protected mitarbeiterSaving = signal(false);
  protected mitarbeiterSaveSuccess = signal(false);
  protected mitarbeiterSaveError = signal(false);

  constructor() {
    effect(() => {
      if (!this.settings.initialized()) return;
      this.shopName = this.settings.shopName();
      this.mitarbeiterPermsLocal = {...this.settings.mitarbeiterPerms()};
    });
  }

  async saveMitarbeiterPerms() {
    this.mitarbeiterSaving.set(true);
    this.mitarbeiterSaveError.set(false);
    try {
      await this.settings.saveMitarbeiterPerms({...this.mitarbeiterPermsLocal});
      this.mitarbeiterSaveSuccess.set(true);
      setTimeout(() => this.mitarbeiterSaveSuccess.set(false), 3000);
    } catch {
      this.mitarbeiterSaveError.set(true);
      setTimeout(() => this.mitarbeiterSaveError.set(false), 4000);
    } finally {
      this.mitarbeiterSaving.set(false);
    }
  }

  async save() {
    this.saving.set(true);
    this.saveError.set(false);
    try {
      // devBannerEnabled is managed in Owner-Settings; pass through the current value unchanged
      await this.settings.save(this.settings.devBannerEnabled(), this.shopName.trim() || 'OnlineShop');
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    } catch {
      this.saveError.set(true);
      setTimeout(() => this.saveError.set(false), 4000);
    } finally {
      this.saving.set(false);
    }
  }
}
