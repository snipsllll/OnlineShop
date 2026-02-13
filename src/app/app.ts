import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterOutlet} from '@angular/router';
import {Topbar} from './Topbar/topbar/topbar';
import {RoutingService} from './services/routing.service';
import {MyRoutes} from './models/enums/MyRoutes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, Topbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {
  private routingService = inject(RoutingService);

  constructor() {
    this.routingService.route(MyRoutes.ADMIN_BESTELLUNG_DETAILS, "hr43")
  }
}
