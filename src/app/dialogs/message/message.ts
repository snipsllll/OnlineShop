import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DialogService} from '../../services/dialog.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message.html',
  styleUrl: './message.css',
})
export class Message {
  protected dialogService = inject(DialogService);
  close() { this.dialogService.closeMessage(); }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.close();
    }
  }
}
