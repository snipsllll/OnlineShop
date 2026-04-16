import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {Topbar} from './Topbar/topbar/topbar';
import {RoutingService} from './services/routing.service';
import {MyRoutes} from './models/enums/MyRoutes';
import {DialogService} from './services/dialog.service';
import {Login} from './dialogs/login/login';
import {Register} from './dialogs/register/register';
import {Confirm} from './dialogs/confirm/confirm';
import {Message} from './dialogs/message/message';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Topbar, Login, Register, Confirm, Message],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected dialogService = inject(DialogService);
  private routingService = inject(RoutingService);

  constructor() {
    this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW);
  }
}
