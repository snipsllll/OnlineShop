import {Component, inject} from '@angular/core';
import {Location} from '@angular/common';
import {ShopSettingsService} from '../../services/shop-settings.service';

@Component({
  selector: 'app-datenschutz',
  standalone: true,
  templateUrl: './datenschutz.html',
  styleUrl: './datenschutz.css',
})
export class Datenschutz {
  private location = inject(Location);
  protected settings = inject(ShopSettingsService);
  goBack() { this.location.back(); }
}
