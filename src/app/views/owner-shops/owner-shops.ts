import {Component} from '@angular/core';
import {OwnerNav} from '../../components/owner-nav/owner-nav';

@Component({
  selector: 'app-owner-shops',
  standalone: true,
  imports: [OwnerNav],
  templateUrl: './owner-shops.html',
  styleUrl: './owner-shops.css',
})
export class OwnerShops {}
