import { Component } from '@angular/core';
import {TopbarItemBase} from '../topbar-item-base';
import {ITopbarIconButton, ITopbarTextButton} from '../../ITopbarItem';
import {TopbarItemType} from '../../TopbarItemType';
import {TopbarItemTextButton} from './topbar-item-text-button/topbar-item-text-button';
import {TopbarItemIconButton} from './topbar-item-icon-button/topbar-item-icon-button';
@Component({
  selector: 'app-topbar-item-button',
  imports: [
    TopbarItemTextButton,
    TopbarItemIconButton
  ],
  templateUrl: './topbar-item-button.html',
  styleUrl: './topbar-item-button.css',
})
export class TopbarItemButton extends TopbarItemBase<ITopbarIconButton | ITopbarTextButton> {

  onButtonClicked() {
    if(this.item.action == undefined) {
      return;
    }

    this.item.action();
  }

  protected readonly TopbarItemType = TopbarItemType;
}
