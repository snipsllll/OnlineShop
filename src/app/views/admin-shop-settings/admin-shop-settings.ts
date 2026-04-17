import {Component, effect, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ShopSettingsService} from '../../services/shop-settings.service';
import {AdminNav} from '../../components/admin-nav/admin-nav';

@Component({
  selector: 'app-admin-shop-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav],
  templateUrl: './admin-shop-settings.html',
  styleUrl: './admin-shop-settings.css',
})
export class AdminShopSettings {
  protected settings = inject(ShopSettingsService);

  protected devBannerEnabled = false;
  protected shopName = '';
  protected saving = signal(false);
  protected saveSuccess = signal(false);
  protected saveError = signal(false);

  constructor() {
    // Read values only after the service has finished loading from Firestore,
    // so the form reflects the actual saved state rather than the defaults.
    effect(() => {
      if (!this.settings.initialized()) return;
      this.devBannerEnabled = this.settings.devBannerEnabled();
      this.shopName = this.settings.shopName();
    });
  }

  async save() {
    this.saving.set(true);
    this.saveError.set(false);
    try {
      await this.settings.save(this.devBannerEnabled, this.shopName.trim() || 'OnlineShop');
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
