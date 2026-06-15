import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { AnnounDialogComponent } from '../announcement-dialog/announcement-dialog.component';

@Component({
  selector: 'app-user-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss',
})
export class UserDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<UserDialogComponent>,
  ) {}

  adminNote = '';
  confirm(action: 'approve' | 'reject') {
    const confirmRef = this.dialog.open(AnnounDialogComponent);
    confirmRef.afterClosed().subscribe((confirmed) => {
      if (confirmed == true) {
        this.dialogRef.close({ action, note: this.adminNote });
      }
    });
  }

  get verifyStatus(): string {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return new Date(this.data.studentVerifiedAt) < oneYearAgo
      ? '已過期'
      : '已驗證';
  }
}
