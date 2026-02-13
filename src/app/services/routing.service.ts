import {inject, Injectable} from '@angular/core';
import {MyRoutes} from '../models/enums/MyRoutes';
import {Router} from '@angular/router';
import {TopbarService} from '../Topbar/topbar.service';

@Injectable({
  providedIn: 'root',
})
export class RoutingService {
  private router = inject(Router);
  private topbarService = inject(TopbarService);

  public route(myRoute: MyRoutes, param?: string): void {
    let route = myRoute.toString();

    if (param) {
      route += "/" + param;
    }

    this.router.navigate([route]).then(x => {
      this.topbarService.setTopbarItems(myRoute);
    });
  }
}
