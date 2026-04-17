import {Injectable} from '@angular/core';
import {UserService} from './user.service';
import {IWarenkorb} from '../models/interfaces/IWarenkorb';

@Injectable({
  providedIn: 'root',
})
export class WarenkorbService {

  constructor(private userService: UserService) {

  }

  public async getWahrenkorb(): Promise<IWarenkorb> {
    const user = await this.userService.getCurrentUser();
    return user.warenkorb ?? { id: '', produkteMitAnzahl: [], gesamtPreis: 0 };
  }

  public async addToWarenkorb(produktId: string, anzahl: number) {
    const wk = await this.getWahrenkorb();
    wk.produkteMitAnzahl = wk.produkteMitAnzahl ?? [];
    if (!wk.produkteMitAnzahl.find(p => p.produktId === produktId)) {
      wk.produkteMitAnzahl.push({ produktId, anzahl });
      await this.updateWarenkorb(wk);
    }
  }

  public async removeFromWarenkorb(produktId: string) {
    const wk = await this.getWahrenkorb();
    wk.produkteMitAnzahl = wk.produkteMitAnzahl ?? [];
    const index = wk.produkteMitAnzahl.findIndex(p => p.produktId === produktId);
    if (index !== -1) {
      wk.produkteMitAnzahl.splice(index, 1);
      await this.updateWarenkorb(wk);
    }
  }

  public async clearWarenkorb() {
    const wk = await this.getWahrenkorb();
    wk.produkteMitAnzahl = [];
    await this.updateWarenkorb(wk);
  }

  public async changeProduktAnzahl(produktId: string, anzahl: number) {
    const wk = await this.getWahrenkorb();
    wk.produkteMitAnzahl = wk.produkteMitAnzahl ?? [];
    const index = wk.produkteMitAnzahl.findIndex(p => p.produktId === produktId);
    if (index !== -1) {
      wk.produkteMitAnzahl[index].anzahl = anzahl;
      await this.updateWarenkorb(wk);
    }
  }

  private async updateWarenkorb(wk: IWarenkorb) {
    const user = await this.userService.getCurrentUser();
    user.warenkorb = wk;
    await this.userService.updateUser(user);
  }
}
