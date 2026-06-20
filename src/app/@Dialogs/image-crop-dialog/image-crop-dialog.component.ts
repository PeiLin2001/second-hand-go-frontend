import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
@Component({
  selector: 'app-image-crop-dialog',
  imports: [MatDialogModule,MatButtonModule, ImageCropperComponent],
  templateUrl: './image-crop-dialog.component.html',
  styleUrl: './image-crop-dialog.component.scss'
})
export class ImageCropDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ImageCropDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { file: File }
  ) {}

  croppedBase64 = '';



// 只要妳在圓框內放大、縮小、移動，這個方法就會即時把新圖片存起來
  onCropped(event: ImageCroppedEvent) {
    // 利用 FileReader 把 event.blob 榨成後端絕對看得懂的真實 Base64！
    if (event.blob) {
      const reader = new FileReader();

      reader.onloadend = () => {
        // 當檔案讀取完畢，這裏拿到的就是真正的 data:image/jpeg;base64,... 巨大字串
        this.croppedBase64 = reader.result as string;
      };

      // 開始啟動讀取
      reader.readAsDataURL(event.blob);
    }
  }

  // 按下確認裁切按鈕時，把最後存下來的這張裁切圖送回去！
  confirmCrop() {
    if (this.croppedBase64) {
      this.dialogRef.close(this.croppedBase64);
    } else {
      console.warn('【大頭貼警告】目前防呆攔截，沒有拿到任何裁切資料。');
      this.dialogRef.close(null);
    }
  }
}
