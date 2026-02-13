import { Component } from '@angular/core';
import {ITopbarIconButton} from '../../../ITopbarItem';
import {TopbarItemBase} from '../../topbar-item-base';

@Component({
  selector: 'app-topbar-item-icon-button',
  imports: [],
  templateUrl: './topbar-item-icon-button.html',
  styleUrl: './topbar-item-icon-button.css',
})
export class TopbarItemIconButton extends TopbarItemBase<ITopbarIconButton>{

}
