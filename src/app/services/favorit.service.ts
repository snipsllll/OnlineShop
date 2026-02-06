import {Injectable} from '@angular/core';
import {UserService} from './user.service';
import {IProdukt} from '../models/interfaces/IProdukt';
import {ProduktService} from './produkt.service';

@Injectable({
  providedIn: 'root',
})
export class FavoritService {

  constructor(private userService: UserService, private produktService: ProduktService) {

  }

  public async getFavoritenIds(): Promise<string[]> {
    return this.userService.getCurrentUser().then(user => {
      return user.favorisierteProduktIds;
    })
  }

  public async getFavoritProdukte(): Promise<IProdukt[]> {
    const produkte = await this.produktService.getProdukte();
    return this.getFavoritenIds().then(ids => {
      return produkte.filter(p => ids.includes(p.id));
    })
  }

  public async addToFavorit(produktId: string) {
    this.userService.getCurrentUser().then(user => {
      if (!user.favorisierteProduktIds.includes(produktId)) {
        user.favorisierteProduktIds.push(produktId);
        this.userService.updateUser(user);
      }
    })
  }

  public async removeFromFavorit(produktId: string) {
    this.userService.getCurrentUser().then(user => {
      if (user.favorisierteProduktIds.includes(produktId)) {
        const index = user.favorisierteProduktIds.indexOf(produktId);
        user.favorisierteProduktIds.splice(index, 1);
        this.userService.updateUser(user);
      }
    })
  }

}
