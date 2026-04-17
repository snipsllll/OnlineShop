import {Component, inject} from '@angular/core';
import {Location} from '@angular/common';

@Component({
  selector: 'app-widerrufsrecht',
  standalone: true,
  templateUrl: './widerrufsrecht.html',
  styleUrl: './widerrufsrecht.css',
})
export class Widerrufsrecht {
  private location = inject(Location);
  goBack() { this.location.back(); }
}
