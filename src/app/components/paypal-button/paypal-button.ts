import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';

declare const paypal: any;

export type PaypalFundingSource = 'paypal' | 'card' | 'paylater';

export interface PaypalResult {
  success: boolean;
  transactionId?: string;
}

@Component({
  selector: 'app-paypal-button',
  standalone: true,
  template: `<div #container></div>`,
})
export class PaypalButton implements AfterViewInit {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;
  @Input() amount = 0;
  @Input() fundingSource?: PaypalFundingSource;
  @Output() onResult = new EventEmitter<PaypalResult>();
  @Output() onReady = new EventEmitter<boolean>();

  private buttons: any | null = null;

  ngAfterViewInit(): void {
    if (!paypal?.Buttons) {
      console.error('PayPal SDK not loaded');
      this.onReady.emit(false);
      return;
    }

    this.buttons = paypal.Buttons({
      fundingSource: this.resolveFundingSource(),
      style: { height: 55 },
      createOrder: (_data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: { value: this.amount.toFixed(2) }
          }]
        });
      },

      onApprove: (_data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
          const transactionId = details?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
          this.onResult.emit({ success: true, transactionId });
        });
      },

      onCancel: () => {
        this.onResult.emit({ success: false });
      },

      onError: (err: any) => {
        console.error('PayPal Fehler', err);
        this.onResult.emit({ success: false });
      }
    });

    try {
      if (typeof this.buttons.isEligible === 'function' && !this.buttons.isEligible()) {
        this.buttons = null;
        this.onReady.emit(false);
        return;
      }
    } catch {
      // ignore
    }

    this.buttons
      .render(this.container.nativeElement)
      .then(() => this.onReady.emit(true))
      .catch((e: any) => {
        console.error('PayPal Buttons render failed', e);
        this.buttons = null;
        this.onReady.emit(false);
      });
  }

  open(): boolean {
    if (!this.buttons) return false;
    if (typeof this.buttons.click === 'function') {
      this.buttons.click();
      return true;
    }
    return false;
  }

  private resolveFundingSource(): any {
    if (!this.fundingSource) return undefined;
    const key = String(this.fundingSource).toUpperCase();
    return paypal?.FUNDING?.[key] ?? this.fundingSource;
  }
}
