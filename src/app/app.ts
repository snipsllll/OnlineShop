import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {Topbar} from './Topbar/topbar/topbar';
import {DialogService} from './services/dialog.service';
import {Login} from './dialogs/login/login';
import {Register} from './dialogs/register/register';
import {Confirm} from './dialogs/confirm/confirm';
import {Message} from './dialogs/message/message';
import {Contact} from './dialogs/contact/contact';
import {Footer} from './components/footer/footer';
import {DevBanner} from './components/dev-banner/dev-banner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Topbar, Login, Register, Confirm, Message, Contact, Footer, DevBanner],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected dialogService = inject(DialogService);
}
