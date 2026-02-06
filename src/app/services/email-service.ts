import {Injectable, OnInit} from '@angular/core';
import emailjs from 'emailjs-com';
import {IEmailWrapper} from '../models/interfaces/IEmailWrapper';
import {UserService} from './user';

@Injectable({
  providedIn: 'root',
})
export class EmailService implements OnInit {
  private serviceId = 'service_fkiil5g';
  private contactUsTemplateId = 'template_fm360uc';

  constructor(private userService: UserService) {
  }

  ngOnInit() {
    emailjs.init('h5bAZeOKLHbXoFgJa');
  }

  sendContactUsMail(contents: IEmailWrapper) {
    emailjs.init('h5bAZeOKLHbXoFgJa');

    this.userService.getCurrentUser().then(user => {
      const templateParams = {
        name: user.vorname + ' ' + user.nachname,
        email: contents.fromMail,
        message: contents.content,
        title: contents.header
      };

      emailjs
        .send(this.serviceId, this.contactUsTemplateId, templateParams)
        .then(
          (response) => {
            console.log(response.status, response.text);
          },
          (error) => {
            console.error('Fehler beim Senden der Email', error);
          }
        );
    })


  }

}
