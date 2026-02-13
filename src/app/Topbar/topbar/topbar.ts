import {Component, inject, WritableSignal} from '@angular/core';
import {TopbarItemButton} from './topbar-item-button/topbar-item-button';
import {TopbarItemText} from './topbar-item-text/topbar-item-text';
import {ITopbarItem} from '../ITopbarItem';
import {TopbarService} from '../topbar.service';
import {TopbarItemType} from '../TopbarItemType';

@Component({
  selector: 'app-topbar',
  imports: [
    TopbarItemButton,
    TopbarItemText
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private topbarService = inject(TopbarService);
  protected topbarItemsSignal: WritableSignal<ITopbarItem[]> = this.topbarService.getTopbarItemsSignal();
  protected readonly TopbarItemType = TopbarItemType;
}
