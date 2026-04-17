import {Component, inject} from '@angular/core';
import {DialogService} from '../../services/dialog.service';
import {RoutingService} from '../../services/routing.service';
import {MyRoutes} from '../../models/enums/MyRoutes';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  protected dialogService = inject(DialogService);
  private routingService = inject(RoutingService);

  readonly year = new Date().getFullYear();

  goAbout() { this.routingService.route(MyRoutes.ABOUT_US); }
  openContact() { this.dialogService.openContact(); }
}
