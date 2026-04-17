import { Component } from '@angular/core';
import {TopbarItemBase} from '../../topbar-item-base';
import {ITopbarTextButton} from '../../../ITopbarItem';

@Component({
  selector: 'app-topbar-item-text-button',
  imports: [],
  templateUrl: './topbar-item-text-button.html',
  styleUrl: './topbar-item-text-button.css',
})
export class TopbarItemTextButton extends TopbarItemBase<ITopbarTextButton> {

}
