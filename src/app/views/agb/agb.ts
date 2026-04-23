import {Component, inject} from '@angular/core';
import {Location} from '@angular/common';
import {ShopSettingsService} from '../../services/shop-settings.service';

@Component({
  selector: 'app-agb',
  standalone: true,
  templateUrl: './agb.html',
  styleUrl: './agb.css',
})
export class Agb {
  private location = inject(Location);
  protected settings = inject(ShopSettingsService);
  goBack() { this.location.back(); }
}
