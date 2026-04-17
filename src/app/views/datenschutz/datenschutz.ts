import {Component, inject} from '@angular/core';
import {Location} from '@angular/common';

@Component({
  selector: 'app-datenschutz',
  standalone: true,
  templateUrl: './datenschutz.html',
  styleUrl: './datenschutz.css',
})
export class Datenschutz {
  private location = inject(Location);
  goBack() { this.location.back(); }
}
