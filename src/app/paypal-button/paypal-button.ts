import { Component, AfterViewInit } from '@angular/core';

declare const paypal: any;

@Component({
  selector: 'app-paypal-button',
  standalone: true,
  template: `
    <div id="paypal-button"></div>
  `
})
export class PaypalButton implements AfterViewInit {

  ngAfterViewInit(): void {
    paypal.Buttons({
      createOrder: (_data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: '769.99'
            }
          }]
        });
      },

      onApprove: (_data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
          console.log('Sandbox Zahlung OK', details);
          alert('Danke ' + details.payer.name.given_name);
        });
      },

      onError: (err: any) => {
        console.error('PayPal Sandbox Fehler', err);
      }
    }).render('#paypal-button');
  }
}
