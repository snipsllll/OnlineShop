import { Component } from '@angular/core';
import {TopbarItemBase} from '../topbar-item-base';
import {ITopbarText} from '../../ITopbarItem';

@Component({
  selector: 'app-topbar-item-text',
  imports: [],
  templateUrl: './topbar-item-text.html',
  styleUrl: './topbar-item-text.css',
})
export class TopbarItemText extends TopbarItemBase<ITopbarText>{

}
