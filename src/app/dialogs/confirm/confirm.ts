import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DialogService} from '../../services/dialog.service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm.html',
  styleUrl: './confirm.css',
})
export class Confirm {
  protected dialogService = inject(DialogService);

  confirm() { this.dialogService.executeConfirm(); }
  cancel() { this.dialogService.closeConfirm(); }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.cancel();
    }
  }
}
