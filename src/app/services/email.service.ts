import {Injectable} from '@angular/core';
import emailjs from 'emailjs-com';

export interface ISupportMail {
  name: string;
  email: string;
  betreff: string;
  nachricht: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private serviceId = 'service_fkiil5g';
  private contactUsTemplateId = 'template_fm360uc';
  private bestellungTemplateId = 'template_bpom1wo';
  private userId = 'h5bAZeOKLHbXoFgJa';

  async sendSupportMail(data: ISupportMail): Promise<void> {
    emailjs.init(this.userId);
    const templateParams = {
      name: data.name,
      email: data.email,
      title: data.betreff,
      message: data.nachricht,
    };
    const response = await emailjs.send(this.serviceId, this.contactUsTemplateId, templateParams);
    if (response.status !== 200) {
      throw new Error('E-Mail konnte nicht gesendet werden.');
    }
  }

  async sendBestellungsbestaetigung(name: string, email: string, orderId: string): Promise<void> {
    emailjs.init(this.userId);
    const response = await emailjs.send(this.serviceId, this.bestellungTemplateId, {
      name,
      email,
      content: this.getBestellbestaetigungstext(orderId),
      subject: this.getBestellbestaetigungsSubject()
    });
    if (response.status !== 200) {
      throw new Error('Bestätigungsmail konnte nicht gesendet werden.');
    }
  }

  async sendVersandbestaetigung(name: string, email: string, orderId: string): Promise<void> {
    emailjs.init(this.userId);
    const response = await emailjs.send(this.serviceId, this.bestellungTemplateId, {
      name,
      email,
      content: this.getVersandbestaetigungstext(orderId),
      subject: this.getVersandbestaetigungsSubject()
    });
    if (response.status !== 200) {
      throw new Error('Bestätigungsmail konnte nicht gesendet werden.');
    }
  }

  private getBestellbestaetigungstext(orderId: string) {
    return "wir haben Ihre Bestellung erhalten und werden sie so schnell es geht bearbeiten.\n" +
      "\n" +
      `BestellungsId: ${orderId} \n` +
      `zu Ihrer Bestellung: \n www.momada.de/#/bestellung-details/${orderId}`
  }

  private getVersandbestaetigungstext(orderId: string) {
    return "wir haben Ihre Bestellung versendet.\n" +
      "\n" +
      `BestellungsId: ${orderId} \n` +
      `zu Ihrer Bestellung: \n www.momada.de/#/bestellung-details/${orderId}`
  }

  private getBestellbestaetigungsSubject() {
    return "Bestellbestätigung für Ihre Bestellung";
  }

  private getVersandbestaetigungsSubject() {
    return "Versandbestätigung für Ihre Bestellung";
  }
}
