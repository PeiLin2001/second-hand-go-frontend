import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { LucideAngularModule, CloudUpload, ChevronDown } from 'lucide-angular';
import { AnnounDialogComponent } from '../announcement-dialog/announcement-dialog.component';
import { from } from 'rxjs';
import { HttpService } from '../../@Services/http.service';
@Component({
  selector: 'app-addannounce-daialog',
  imports: [CommonModule, FormsModule, MatDialogModule, LucideAngularModule],
  templateUrl: './addannounce-daialog.component.html',
  styleUrl: './addannounce-daialog.component.scss',
})
export class AddannounceDaialogComponent {
  constructor(
    private diao: MatDialog,
    private dialogRef: MatDialogRef<AddannounceDaialogComponent>,
    public http: HttpService,
  ) {}

  readonly uploadIcon = CloudUpload;
  readonly chevronIcon = ChevronDown;

  submitted = false;
  // 接收傳進來的資料，沒有傳就是 null（新增模式）
  public data = inject(MAT_DIALOG_DATA);

  today: string = new Date().toLocaleDateString('en-CA');

  selectedFile: File | null = null;

  // 編輯模式時，存放現有的圖片網址
  existingImgUrl: string | null = null;
  // 使用者選了新圖片時的預覽
  previewUrl: string | null = null;

  form = {
    title: '',
    shelfDate: '',
    removalDate: '',
    content: '',
    imgFile: null as File | null, //as...類型可能是A或B(A | B)
    isPublished: false as boolean, // 原本是 null as boolean | null
    publishMode: null as string | null,
  };

  // 判斷是新增還是編輯模式
  get isEditMode(): boolean {
    return !!this.data;
  }

  // 目前顯示的圖片：優先顯示新選的，沒有就顯示舊的
  get displayImgUrl(): string | null {
    return this.previewUrl ?? this.existingImgUrl;
  }

  ngOnInit() {
    if (this.data) {
      this.form.title = this.data.title;
      this.form.shelfDate = this.data.startDate;
      this.form.removalDate = this.data.endDate;
      this.form.content = this.data.content ?? '';
      this.form.isPublished = this.data.isPublished; // 直接帶入 boolean
      this.existingImgUrl = this.data.imgPath;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;

    this.compressImage(input.files[0], 800, 0.7).then((base64) => {
      this.previewUrl = base64;
      this.existingImgUrl = base64;
      this.form.imgFile = input.files![0];
    });
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    this.compressImage(file, 800, 0.7).then((base64) => {
      this.previewUrl = base64;
      this.existingImgUrl = base64;
      this.form.imgFile = file;
    });
  }

  private compressImage(
    file: File,
    maxWidth: number,
    quality: number,
  ): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(event: Event) {
    event.stopPropagation();
    this.form.imgFile = null;
    this.previewUrl = null;
    this.existingImgUrl = null;
  }

  submit() {
    this.submitted = true;

    const firstError = this.getFirstError();
    if (firstError) {
      document
        .getElementById(firstError)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const isPublished = this.form.isPublished === true;

    const payload: any = {
      title: this.form.title,
      shelfDate: this.form.shelfDate,
      removalDate: this.form.removalDate,
      content: this.form.content || null,
      publish: isPublished,
      imgPath: this.existingImgUrl?.includes('base64,')
        ? this.existingImgUrl.split('base64,')[1]
        : this.existingImgUrl,
    };

    // 編輯模式帶 id
    if (this.isEditMode) {
      payload.id = this.data.id;
    }

    const apiUrl = this.isEditMode
      ? 'http://localhost:8080/announce/updataAnnounce'
      : 'http://localhost:8080/announce/addAnnounce';

    const callApi = () => {
      this.http.postApi(apiUrl, payload).subscribe((res: any) => {
        if (res.statusCode === 200) this.dialogRef.close(true);
      });
    };

    // 發布才需要確認 dialog
    if (isPublished) {
      const confirmRef = this.diao.open(AnnounDialogComponent);
      confirmRef.afterClosed().subscribe((confirmed) => {
        if (confirmed === true) callApi();
      });
    } else {
      callApi();
    }
  }

  getFirstError() {
    if (!this.form.title) return 'field-title';
    if (!this.form.shelfDate) return 'field-shelfDate';
    if (!this.form.removalDate || this.form.removalDate < this.today)
      return 'field-removalDate';
    if (!this.displayImgUrl) return 'field-img';
    return null;
  }

  cancel() {
    this.dialogRef.close(null);
  }

  get isExpired(): boolean {
    return !!this.data && this.data.endDate < this.today;
  }
}
