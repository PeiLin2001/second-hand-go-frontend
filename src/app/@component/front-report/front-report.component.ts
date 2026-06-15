import { ApiTestService } from './../../@Services/api-test.service';
import { UserService } from './../../@Services/user.service';
import { Component, Inject, Optional } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, } from '@angular/forms';
import {
  LucideAngularModule,
  SendHorizontal, X, UploadIcon, Trash2,
} from 'lucide-angular';
import Swal from 'sweetalert2';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, } from '@angular/material/dialog';
import { ReportDialogData } from '../../@Services/report.service';

@Component({
  selector: 'app-front-report',
  imports: [ReactiveFormsModule, LucideAngularModule, MatDialogModule],
  templateUrl: './front-report.component.html',
  styleUrl: './front-report.component.scss',
})
export class FrontReportComponent {
  constructor(
    // Optional 讓路由直接開啟時不會因為沒有 data 而報錯
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: ReportDialogData,
    @Optional() private dialogRef: MatDialogRef<FrontReportComponent>,
    private userService: UserService,
    private apiTestService: ApiTestService,
  ) { }

  // Declare icon
  readonly SendHorizontal = SendHorizontal;
  readonly X = X;
  readonly UploadIcon = UploadIcon;
  readonly Trash2 = Trash2;

  reportForm!: FormGroup;
  errorMessage: string | null = null;

  // 圖片預覽（最多三張）
  imagePreviews: string[] = [];
  readonly MAX_IMAGES = 3;

  // 判斷是否從 Dialog 開啟（有注入 data 就是 Dialog 模式）
  get isDialogMode(): boolean {
    return !!this.dialogData;
  }

  // tabs
  currentTab = '檢舉商品'; // 預設選中
  tabsColumns: string[] = ['檢舉商品', '檢舉用戶'];

  changeTab(tabName: string) {
    this.currentTab = tabName;
    this.reportForm.get('violationType')?.reset(''); //重置檢舉原因

    // 💡 取得控制項的引用，少寫一點點程式碼
    const nameCtrl = this.reportForm.get('accusedName');
    const idCtrl = this.reportForm.get('accusedId');
    const productCtrl = this.reportForm.get('productId');

    // 判斷在 Dialog 模式下的處理邏輯
    if (this.isDialogMode) {
      nameCtrl?.enable();
      idCtrl?.enable();
      productCtrl?.enable();

      // 1. 如果切換過去的 Tab 跟 Dialog 帶進來的 type 一致，才帶入初始資料；不一致就清空！
      // 這樣可以防止「點擊檢舉商品進來，切換到檢舉用戶時，用戶名稱還顯示商品名稱」的尷尬狀況
      const isMatchingTab =
        (this.dialogData?.type === 'product' && tabName === '檢舉商品') ||
        (this.dialogData?.type === 'user' && tabName === '檢舉用戶');

      if (isMatchingTab) {
        nameCtrl?.reset(this.dialogData?.accusedName || '');
        idCtrl?.reset(this.dialogData?.accusedId || '');
        productCtrl?.reset(this.dialogData?.productId || '');
        // 帶入初始資料後，因為是 Dialog 模式，要再次鎖定
        nameCtrl?.disable();
        idCtrl?.disable();
        productCtrl?.disable();
      } else {
        // 換到不對應的頁籤時（例如點商品進來卻想檢舉用戶），清空並「解鎖」讓使用者自己填
        nameCtrl?.reset('');
        idCtrl?.reset('');
        productCtrl?.reset('');
      }
    } else {
      // 💡 在獨立網頁模式下，切換分頁就「徹底清空」並「解除鎖定」
      nameCtrl?.enable();
      idCtrl?.enable();
      productCtrl?.enable();

      nameCtrl?.reset('');
      idCtrl?.reset('');
      productCtrl?.reset('');
    }
  }

  // 兩個 tab 各自的設定
  readonly tabConfig: Record<string, {
    nameLable: string;
    idLabel: string;
    reportColumns: string[];
  }> = {
      '檢舉商品': {
        nameLable: '檢舉商品名稱',
        idLabel: '檢舉商品ID',
        reportColumns: [
          '此商品可能令人感到不適或違反善良風俗',
          '商品描述不實（照片與實物不符）',
          '惡意哄抬價格',
          '重複上架同一商品',
          '販售違禁品/仿冒品',
          '誇大不實療效/涉及醫療效能',
          '活體動物、保育動物及其製品',
          '其他',
        ],
      },
      '檢舉用戶': {
        nameLable: '檢舉用戶名稱',
        idLabel: '檢舉用戶ID',
        reportColumns: [
          '面交未依約定時間到指定地點',
          '惡意刷評價（假好評/惡意差評）',
          '惡意取消訂單',
          '詐騙（釣魚連結、假客服）',
          '騷擾/威脅其他用戶',
          '盜用他人帳號',
          '其他',
        ],
      },
    };

  // 取得目前 tab 的設定
  get config() {
    return this.tabConfig[this.currentTab] ?? this.tabConfig['檢舉商品'];
  }

  ngOnInit() {
    this.reportForm = new FormGroup({
      accusedName: new FormControl(
        this.dialogData?.accusedName || '', Validators.required,
      ), // 被檢舉者名稱
      accusedId: new FormControl(
        this.dialogData?.accusedId || '', Validators.required,
      ), // 被檢舉者ID
      violationType: new FormControl('', Validators.required), // 檢舉類型
      description: new FormControl('', [
        Validators.required, Validators.minLength(10), Validators.maxLength(200)
      ]), // 檢舉原因描述
      imagePreviews: new FormControl(null, [Validators.required]), // 圖片檔案欄位（預設為 null）
      productId: new FormControl(
        this.dialogData?.productId || '', Validators.required,     // 商品 ID
      ),
    });

    // 選「其他」時描述字數增加到 20 字
    this.reportForm.get('violationType')?.valueChanges.subscribe((selectedType) => {
      const descControl = this.reportForm.get('description');
      descControl?.setValidators([
        Validators.required,
        Validators.minLength(selectedType === '其他' ? 20 : 10),
        Validators.maxLength(200)
      ])
      descControl?.updateValueAndValidity(); // 叫 Angular 重新驗證該欄位
    });

    // 如果是 Dialog 模式，根據 type 決定預設 tab
    if (this.dialogData) {
      this.currentTab = this.dialogData.type === 'product' ? '檢舉商品' : '檢舉用戶';
      this.reportForm.get('accusedName')?.disable();
      this.reportForm.get('accusedId')?.disable();
      this.reportForm.get('productId')?.disable();
    }
  }

  // 圖片上傳
  onFileSelected(event: Event) {
    this.errorMessage = null; // 清空先前的錯誤
    const element = event.currentTarget as HTMLInputElement;
    const file = element.files?.[0];
    if (!file) return;

    // 張數上限
    if (this.imagePreviews.length >= this.MAX_IMAGES) {
      this.errorMessage = `最多只能上傳 ${this.MAX_IMAGES} 張圖片！`;
      return;
    }

    // 格式檢查
    if (!file.type.startsWith('image/')) {
      this.errorMessage = '請上傳正確的圖片格式（PNG, JPG, JPEG）！';
      return;
    }

    // 大小檢查（2MB）
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = '檔案大小不能超過 2MB！';
      return;
    }

    // 產生預覽
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviews.push(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 清空 input，讓同一張圖可以重複選
    element.value = '';
  }

  // 刪除指定圖片
  removeImage(index: number) {
    this.imagePreviews.splice(index, 1);
    this.errorMessage = null;
  }

  // 確認送出
  confirmSend() {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      if (this.imagePreviews.length === 0) {
        this.errorMessage = '請上傳至少一張圖片！';
        return;
      }
    }
    Swal.fire({
      title: '確認送出檢舉？',
      text: '確認後將無法撤回！',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '確認送出',
      cancelButtonText: '再想想',
    }).then((result) => {
      if (result.isConfirmed) {
        this.onSubmit();
      }
    });
  }

  // 取消
  cancel() {
    Swal.fire({
      title: '確定要取消嗎？',
      text: '填寫的內容將會清空',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '確定取消',
      cancelButtonText: '繼續填寫',
    }).then((result) => {
      if (result.isConfirmed) {
        this.closeDialog();
      }
    });
  }

  // 送出表單
  onSubmit() {

    const formValues = this.reportForm.getRawValue();
    const finalData = {
      accusedId: formValues.accusedId,
      description: formValues.description,
      violationType: formValues.violationType,
      type: this.currentTab === '檢舉商品' ? 'product' : 'user',
      productId: this.currentTab === '檢舉商品' ? formValues.productId : null, // 商品檢舉才帶，用戶檢舉給 null 或不傳
      filePath: this.imagePreviews //
    };

    console.log('JSON 封包已打包完成：', finalData);
    this.apiTestService.addReport(finalData).subscribe({
      next: (res) => {
        console.error('成功：', res);
        Swal.fire({
          title: '檢舉已送出！',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          this.closeDialog();
        });
      },
      error: (err) => {
        console.error('失敗：', err);
      }
    })


  }

  closeDialog() {
    if (this.isDialogMode) {
      this.dialogRef.close();
    } else {
      this.reportForm.reset();
      this.imagePreviews = [];
      this.errorMessage = null;
    }
  }
}
