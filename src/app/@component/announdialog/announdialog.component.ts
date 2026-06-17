import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import {  LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-announdialog',
  imports: [CommonModule, MatDialogModule, LucideAngularModule],
  templateUrl: './announdialog.component.html',
  styleUrl: './announdialog.component.scss'
})
export class AnnoundialogComponent {

 data = inject(MAT_DIALOG_DATA);
  readonly closeIcon = X;
}

export interface AnnouncementDetail {
  id: number;
  title: string;
  shelfDate: string;
  removalDate: string;
  publish: boolean;
  content?: string;
  imgPath: string;
}
