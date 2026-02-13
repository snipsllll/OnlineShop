import {Injectable, signal, WritableSignal} from '@angular/core';
import {ITopbarItem} from './ITopbarItem';
import {MyRoutes} from '../models/enums/MyRoutes';
import {AccountButton, FavoritButton, TestText, TestTextButton, WarenkorbButton} from './TopbarItems';

@Injectable({
  providedIn: 'root',
})
export class TopbarService {
  private topbarItems: WritableSignal<ITopbarItem[]> = signal([]);

  public getTopbarItemsSignal(): WritableSignal<ITopbarItem[]> {
    return this.topbarItems;
  }

  public setTopbarItems(route: MyRoutes) {
    const items = this.getItemsByRoute(route);
    this.topbarItems.set(items);
  }

  private getItemsByRoute(route: MyRoutes): ITopbarItem[] {
    let items: ITopbarItem[] = [];

    //default items - Diese items kommen immer rein
    items.push(AccountButton);
    items.push(TestText);
    items.push(TestTextButton);

    //favorit button
    switch(route) {
      case MyRoutes.PRODUKT_DETAILS:
      case MyRoutes.FAVORITEN_LISTE:
      case MyRoutes.BESTELLUNGEN_OVERVIEW:
      case MyRoutes.BESTELLUNG_DETAILS:
      case MyRoutes.ACCOUNT_SETTINGS:
      case MyRoutes.PRODUKTE_OVERVIEW:
        items.push(FavoritButton);
    }

    //warenkorb button
    switch(route) {
      case MyRoutes.PRODUKT_DETAILS:
      case MyRoutes.FAVORITEN_LISTE:
      case MyRoutes.BESTELLUNGEN_OVERVIEW:
      case MyRoutes.BESTELLUNG_DETAILS:
      case MyRoutes.ACCOUNT_SETTINGS:
      case MyRoutes.PRODUKTE_OVERVIEW:
        items.push(WarenkorbButton);
    }

    return items;
  }
}
