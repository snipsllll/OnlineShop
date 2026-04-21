import {Injectable, signal} from '@angular/core';
import {UserService} from './user.service';
import {IWarenkorb} from '../models/interfaces/IWarenkorb';
import {auth} from '../../environments/environment';

const GUEST_CART_KEY = 'guest_warenkorb';

@Injectable({
  providedIn: 'root',
})
export class WarenkorbService {
  readonly cartCount = signal(0);

  constructor(private userService: UserService) {
    this.refreshCount();
  }

  async refreshCount(): Promise<void> {
    try {
      const wk = await this.getWahrenkorb();
      this.cartCount.set(wk?.produkteMitAnzahl?.length ?? 0);
    } catch {
      this.cartCount.set(0);
    }
  }

  private get loggedIn(): boolean {
    return !!auth.currentUser;
  }

  private getGuestCart(): IWarenkorb {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { id: 'guest', produkteMitAnzahl: [], gesamtPreis: 0 };
  }

  private saveGuestCart(wk: IWarenkorb): void {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(wk));
  }

  public async getWahrenkorb(): Promise<IWarenkorb> {
    if (!this.loggedIn) return this.getGuestCart();
    const user = await this.userService.getCurrentUser();
    return user.warenkorb ?? { id: '', produkteMitAnzahl: [], gesamtPreis: 0 };
  }

  public async addToWarenkorb(produktId: string, anzahl: number) {
    if (!this.loggedIn) {
      const wk = this.getGuestCart();
      const existing = wk.produkteMitAnzahl.find(p => p.produktId === produktId);
      if (existing) {
        existing.anzahl += anzahl;
      } else {
        wk.produkteMitAnzahl.push({ produktId, anzahl });
      }
      this.saveGuestCart(wk);
      this.cartCount.set(wk.produkteMitAnzahl.length);
      return;
    }
    const wk = await this.getWahrenkorb();
    wk.produkteMitAnzahl = wk.produkteMitAnzahl ?? [];
    const existing = wk.produkteMitAnzahl.find(p => p.produktId === produktId);
    if (existing) {
      existing.anzahl += anzahl;
    } else {
      wk.produkteMitAnzahl.push({ produktId, anzahl });
    }
    await this.updateWarenkorb(wk);
    this.cartCount.set(wk.produkteMitAnzahl.length);
  }

  public async removeFromWarenkorb(produktId: string) {
    if (!this.loggedIn) {
      const wk = this.getGuestCart();
      wk.produkteMitAnzahl = wk.produkteMitAnzahl.filter(p => p.produktId !== produktId);
      this.saveGuestCart(wk);
      this.cartCount.set(wk.produkteMitAnzahl.length);
      return;
    }
    const wk = await this.getWahrenkorb();
    wk.produkteMitAnzahl = wk.produkteMitAnzahl ?? [];
    const index = wk.produkteMitAnzahl.findIndex(p => p.produktId === produktId);
    if (index !== -1) {
      wk.produkteMitAnzahl.splice(index, 1);
      await this.updateWarenkorb(wk);
    }
    this.cartCount.set(wk.produkteMitAnzahl.length);
  }

  public async clearWarenkorb() {
    if (!this.loggedIn) {
      localStorage.removeItem(GUEST_CART_KEY);
      this.cartCount.set(0);
      return;
    }
    const wk = await this.getWahrenkorb();
    wk.produkteMitAnzahl = [];
    await this.updateWarenkorb(wk);
    this.cartCount.set(0);
  }

  public async changeProduktAnzahl(produktId: string, anzahl: number) {
    if (!this.loggedIn) {
      const wk = this.getGuestCart();
      const item = wk.produkteMitAnzahl.find(p => p.produktId === produktId);
      if (item) {
        item.anzahl = anzahl;
        this.saveGuestCart(wk);
      }
      return;
    }
    const wk = await this.getWahrenkorb();
    wk.produkteMitAnzahl = wk.produkteMitAnzahl ?? [];
    const index = wk.produkteMitAnzahl.findIndex(p => p.produktId === produktId);
    if (index !== -1) {
      wk.produkteMitAnzahl[index].anzahl = anzahl;
      await this.updateWarenkorb(wk);
    }
  }

  public async mergeGuestCart(): Promise<void> {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return;
    let guestItems: Array<{produktId: string, anzahl: number}>;
    try {
      guestItems = JSON.parse(raw)?.produkteMitAnzahl ?? [];
    } catch {
      localStorage.removeItem(GUEST_CART_KEY);
      return;
    }
    if (!guestItems.length) {
      localStorage.removeItem(GUEST_CART_KEY);
      return;
    }
    const user = await this.userService.getCurrentUser();
    const wk = user.warenkorb ?? { id: '', produkteMitAnzahl: [], gesamtPreis: 0 };
    for (const guestItem of guestItems) {
      const existing = wk.produkteMitAnzahl.find(p => p.produktId === guestItem.produktId);
      if (existing) {
        existing.anzahl += guestItem.anzahl;
      } else {
        wk.produkteMitAnzahl.push(guestItem);
      }
    }
    user.warenkorb = wk;
    await this.userService.updateUser(user);
    localStorage.removeItem(GUEST_CART_KEY);
  }

  private async updateWarenkorb(wk: IWarenkorb) {
    const user = await this.userService.getCurrentUser();
    user.warenkorb = wk;
    await this.userService.updateUser(user);
  }
}
