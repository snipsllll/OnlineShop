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
}
