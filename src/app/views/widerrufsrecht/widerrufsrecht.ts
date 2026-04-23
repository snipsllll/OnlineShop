import {Component, inject} from '@angular/core';
import {Location} from '@angular/common';
import {ShopSettingsService} from '../../services/shop-settings.service';

@Component({
  selector: 'app-widerrufsrecht',
  standalone: true,
  templateUrl: './widerrufsrecht.html',
  styleUrl: './widerrufsrecht.css',
})
export class Widerrufsrecht {
  private location = inject(Location);
  protected settings = inject(ShopSettingsService);
  goBack() { this.location.back(); }
}
