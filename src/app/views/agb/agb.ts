import {Component, inject} from '@angular/core';
import {Location} from '@angular/common';

@Component({
  selector: 'app-agb',
  standalone: true,
  templateUrl: './agb.html',
  styleUrl: './agb.css',
})
export class Agb {
  private location = inject(Location);
  goBack() { this.location.back(); }
}
