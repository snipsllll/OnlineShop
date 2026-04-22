import {Component, AfterViewInit, Input, EventEmitter, Output} from '@angular/core';

declare const paypal: any;

@Component({
  selector: 'app-paypal-button',
  standalone: true,
  template: `<div id="paypal-button"></div>`
})
export class PaypalButton implements AfterViewInit {
  @Input() amount = 0;
  @Output() onResult = new EventEmitter<boolean>();

  ngAfterViewInit(): void {
    paypal.Buttons({
      createOrder: (_data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: { value: this.amount.toFixed(2) }
          }]
        });
      },

      onApprove: (_data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
          console.log('Sandbox Zahlung OK', details);
          this.onResult.emit(true);
        });
      },

      onError: (err: any) => {
        console.error('PayPal Sandbox Fehler', err);
        this.onResult.emit(false);
      }
    }).render('#paypal-button');
  }
}
