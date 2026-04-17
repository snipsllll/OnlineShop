import {Injectable, signal} from '@angular/core';
import {doc, Firestore, getDoc, setDoc} from 'firebase/firestore';
import {onAuthStateChanged} from 'firebase/auth';
import {auth, db} from '../../environments/environment';

export interface IShopSettings {
  devBannerEnabled: boolean;
  shopName: string;
}

@Injectable({
  providedIn: 'root',
})
export class ShopSettingsService {
  readonly devBannerEnabled = signal(false);
  readonly shopName = signal('OnlineShop');
  readonly initialized = signal(false);

  constructor() {
    // Wait for Firebase auth to be determined before querying Firestore.
    // Without this, getDoc fires before auth is restored on page load,
    // causing permission errors if Firestore rules require authentication.
    const unsub = onAuthStateChanged(auth, () => {
      unsub();
      this.load();
    });
  }

  private async load(): Promise<void> {
    try {
      const snap = await getDoc(doc(db as Firestore, 'settings', 'shop'));
      if (snap.exists()) {
        const d = snap.data();
        this.devBannerEnabled.set(d['devBannerEnabled'] ?? false);
        this.shopName.set(d['shopName'] ?? 'OnlineShop');
      }
    } catch (e) {
      console.error('ShopSettingsService: failed to load settings', e);
    }
    this.initialized.set(true);
  }

  async save(devBannerEnabled: boolean, shopName: string): Promise<void> {
    await setDoc(doc(db as Firestore, 'settings', 'shop'), { devBannerEnabled, shopName });
    this.devBannerEnabled.set(devBannerEnabled);
    this.shopName.set(shopName);
  }
}
