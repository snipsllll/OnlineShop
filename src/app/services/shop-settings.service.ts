import {Injectable, signal} from '@angular/core';
import {doc, Firestore, getDoc, setDoc} from 'firebase/firestore';
import {onAuthStateChanged} from 'firebase/auth';
import {auth, db} from '../../environments/environment';

export interface IRolePerms {
  canManageProducts: boolean;
  canManageOrders: boolean;
  canViewUsers: boolean;
  canEditUsers: boolean;
  canManageShopSettings: boolean;
}

export interface IMitarbeiterPerms {
  canManageProducts: boolean;
  canManageOrders: boolean;
  canViewUsers: boolean;
}

const DEFAULT_ADMIN_PERMS: IRolePerms = {
  canManageProducts: true,
  canManageOrders: true,
  canViewUsers: true,
  canEditUsers: false,
  canManageShopSettings: true,
};

const DEFAULT_MITARBEITER_PERMS: IMitarbeiterPerms = {
  canManageProducts: false,
  canManageOrders: false,
  canViewUsers: false,
};

export type ShopTheme = 'modern' | 'garden' | 'night' | 'ocean' | 'sunset' | 'lavender' | 'ice' | 'autumn' | 'gold' | 'pearl';

@Injectable({
  providedIn: 'root',
})
export class ShopSettingsService {
  readonly devBannerEnabled = signal(false);
  readonly shopName = signal('OnlineShop');
  readonly adminPerms = signal<IRolePerms>({...DEFAULT_ADMIN_PERMS});
  readonly mitarbeiterPerms = signal<IMitarbeiterPerms>({...DEFAULT_MITARBEITER_PERMS});
  readonly mitarbeiterRoleEnabled = signal(true);
  readonly theme = signal<ShopTheme>('modern');
  readonly initialized = signal(false);

  constructor() {
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
        this.adminPerms.set({...DEFAULT_ADMIN_PERMS, ...(d['adminPerms'] ?? {})});
        this.mitarbeiterPerms.set({...DEFAULT_MITARBEITER_PERMS, ...(d['mitarbeiterPerms'] ?? {})});
        this.mitarbeiterRoleEnabled.set(d['mitarbeiterRoleEnabled'] ?? true);
        const raw = d['theme'];
        const valid: ShopTheme[] = ['modern','garden','night','ocean','sunset','lavender','ice','autumn','gold','pearl'];
        const t: ShopTheme = valid.includes(raw) ? raw as ShopTheme : 'modern';
        this.theme.set(t);
        this.applyTheme(t);
      }
    } catch (e) {
      console.error('ShopSettingsService: failed to load settings', e);
    }
    this.initialized.set(true);
  }

  private applyTheme(theme: ShopTheme) {
    if (theme === 'modern') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  private fullDoc() {
    return {
      devBannerEnabled: this.devBannerEnabled(),
      shopName: this.shopName(),
      adminPerms: this.adminPerms(),
      mitarbeiterPerms: this.mitarbeiterPerms(),
      mitarbeiterRoleEnabled: this.mitarbeiterRoleEnabled(),
      theme: this.theme(),
    };
  }

  async save(devBannerEnabled: boolean, shopName: string): Promise<void> {
    const data = {...this.fullDoc(), devBannerEnabled, shopName};
    await setDoc(doc(db as Firestore, 'settings', 'shop'), data);
    this.devBannerEnabled.set(devBannerEnabled);
    this.shopName.set(shopName);
  }

  async saveAdminPerms(perms: IRolePerms): Promise<void> {
    // Ensure Mitarbeiter never has more than Admin
    const mit = this.mitarbeiterPerms();
    const clampedMit: IMitarbeiterPerms = {
      canManageProducts: mit.canManageProducts && perms.canManageProducts,
      canManageOrders:   mit.canManageOrders   && perms.canManageOrders,
      canViewUsers:      mit.canViewUsers       && perms.canViewUsers,
    };
    const data = {...this.fullDoc(), adminPerms: perms, mitarbeiterPerms: clampedMit};
    await setDoc(doc(db as Firestore, 'settings', 'shop'), data);
    this.adminPerms.set(perms);
    this.mitarbeiterPerms.set(clampedMit);
  }

  async saveMitarbeiterRoleEnabled(enabled: boolean): Promise<void> {
    const data = {...this.fullDoc(), mitarbeiterRoleEnabled: enabled};
    await setDoc(doc(db as Firestore, 'settings', 'shop'), data);
    this.mitarbeiterRoleEnabled.set(enabled);
  }

  async saveTheme(theme: ShopTheme): Promise<void> {
    const data = {...this.fullDoc(), theme};
    await setDoc(doc(db as Firestore, 'settings', 'shop'), data);
    this.theme.set(theme);
    this.applyTheme(theme);
  }

  async saveMitarbeiterPerms(perms: IMitarbeiterPerms): Promise<void> {
    // Strip any permissions Admin doesn't have
    const admin = this.adminPerms();
    const clamped: IMitarbeiterPerms = {
      canManageProducts: perms.canManageProducts && admin.canManageProducts,
      canManageOrders:   perms.canManageOrders   && admin.canManageOrders,
      canViewUsers:      perms.canViewUsers       && admin.canViewUsers,
    };
    const data = {...this.fullDoc(), mitarbeiterPerms: clamped};
    await setDoc(doc(db as Firestore, 'settings', 'shop'), data);
    this.mitarbeiterPerms.set(clamped);
  }
}
