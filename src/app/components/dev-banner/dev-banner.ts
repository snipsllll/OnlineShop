import {AfterViewInit, Component, ElementRef, inject, OnDestroy} from '@angular/core';
import {ShopSettingsService} from '../../services/shop-settings.service';

@Component({
  selector: 'app-dev-banner',
  standalone: true,
  imports: [],
  templateUrl: './dev-banner.html',
  styleUrl: './dev-banner.css',
})
export class DevBanner implements AfterViewInit, OnDestroy {
  protected settings = inject(ShopSettingsService);
  private el = inject(ElementRef);
  private ro?: ResizeObserver;

  ngAfterViewInit() {
    this.ro = new ResizeObserver(() => this.syncHeight());
    this.ro.observe(this.el.nativeElement);
    this.syncHeight();
  }

  ngOnDestroy() {
    this.ro?.disconnect();
    document.documentElement.style.removeProperty('--dev-banner-height');
  }

  private syncHeight() {
    const h = (this.el.nativeElement as HTMLElement).offsetHeight;
    document.documentElement.style.setProperty('--dev-banner-height', `${h}px`);
  }
}
