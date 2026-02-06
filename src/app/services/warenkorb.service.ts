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
    return this.userService.getCurrentUser().then(user => {
      return user.warenkorb;
    })
  }

  public async addToWarenkorb(produktId: string, anzahl: number) {
    this.getWahrenkorb().then(wk => {
      if (!wk.produkteMitAnzahl.find(p => p.produktId === produktId)) {
        wk.produkteMitAnzahl.push({produktId: produktId, anzahl: anzahl})
        this.updateWarenkorb(wk);
      }
    })
  }

  public async removeFromWarenkorb(produktId: string) {
    this.getWahrenkorb().then(wk => {
      if (wk.produkteMitAnzahl.find(p => p.produktId === produktId)) {
        const index = wk.produkteMitAnzahl.findIndex(p => p.produktId === produktId);
        wk.produkteMitAnzahl.splice(index, 1);
        this.updateWarenkorb(wk);
      }
    })
  }

  public async clearWarenkorb() {
    this.getWahrenkorb().then(wk => {
      wk.produkteMitAnzahl = [];
      this.updateWarenkorb(wk);
    });
  }

  public async changeProduktAnzahl(produktId: string, anzahl: number) {
    this.getWahrenkorb().then(wk => {
      if (wk.produkteMitAnzahl.find(p => p.produktId === produktId)) {
        const index = wk.produkteMitAnzahl.findIndex(p => p.produktId === produktId);
        wk.produkteMitAnzahl[index].anzahl = anzahl;
        this.updateWarenkorb(wk);
      }
    })
  }

  private async updateWarenkorb(wk: IWarenkorb) {
    this.userService.getCurrentUser().then(user => {
      user.warenkorb = wk;
      this.userService.updateUser(user);
    })
  }
}
