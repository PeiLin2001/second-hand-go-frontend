import { Component, computed, ElementRef, HostListener, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import {  map, Observable, startWith } from 'rxjs';
import {
  LucideAngularModule,
  PencilLine,
  Box,
  Mail,
  Phone,
  MapPin,
  BookUser,
  School,
  ClipboardPenLine,
  LockKeyhole,
  ChevronDown,
  ChevronUp,
} from 'lucide-angular';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SchoolDataService } from '../../@Services/school-data.service';
import Swal from 'sweetalert2';
import { UserService } from '../../@Services/user.service';
import { ChangePasswordVo, SetInfoVo } from '../../@Interface/user';
import { ApiTestService } from '../../@Services/api-test.service';
import { MatDialog } from '@angular/material/dialog';
import { ImageCropDialogComponent } from '../../@Dialogs/image-crop-dialog/image-crop-dialog.component';

@Component({
  selector: 'app-profile-settings',
  imports: [
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    AsyncPipe,
    LucideAngularModule,

  ],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss',
})
export class ProfileSettingsComponent {
  // --- 唯讀常數與圖標 ---
readonly icons = { School, MapPin, Phone, Box, Mail, ChevronUp, PencilLine, BookUser, ClipboardPenLine, LockKeyhole, ChevronDown };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private schoolService: SchoolDataService,
    private userService: UserService,
    private elementRef: ElementRef,
    private apiTestService: ApiTestService,
    private dialog: MatDialog
  ) {}
  // --- 狀態變數 ---
  isEditingBasic = false;
  isEditingPassword = false;
  hideOldPassword = signal(true);
  hideNewPassword = signal(true);
  hideConfirmPassword = signal(true);

  // --- 使用者原始數據 (與後端對接用) ---
  currentUserId: number | null = null;
  name = '';
  school = '';
  department = '';
  phone = '';
  email = '';
  profile = '';
  avatarUrl: string | ArrayBuffer | null = '';

  score: number = 0; //評分
  onTheShelves:  number = 0 ;  //目前上架
  myProducts: any[] = [];   // 存放自己商品卡片的陣列

  // --- 暫存與記憶箱子 ---
  tempName = '';
  selectedAvatarFile: File | null = null; //照片暫存
  private backupData: any = {}; // 按下取消時，用來跨時空倒流的記憶箱子

  // --- 表單控制項 (獨立的盒子) ---
  schoolControl = new FormControl(this.school, [Validators.required]);
  deptControl = new FormControl(this.department);
  phoneControl = new FormControl('', [Validators.pattern(/^09-\d{8}$/)]);
  profileControl = new FormControl(this.profile);
  allRegions = computed(() => this.schoolService.allRegions());
  selectedAreas: string[] = [];
  isAreaDrawerOpen = false;
  readonly MAX_AREAS = 3;
  passwordForm!: FormGroup;

  get isAreaValid(): boolean {
  return this.selectedAreas.length > 0;
  }

  // 用一個物件把所有基本資料的控制項打包打包！
  // 未來如果有增加「生日、性別」，接直往這裡塞一列就好，下方所有邏輯都不用動！
  private get basicControlsMap() {
    return {
      dept: this.deptControl,
      phone: this.phoneControl,
      profile: this.profileControl,
    };
  }

  // --- RxJS 動態水管 ---
  filteredDepts!: Observable<string[]>;

@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
  if (!this.isAreaDrawerOpen) return;

  const target = event.target as HTMLElement;
  const clickedInside = this.elementRef.nativeElement.querySelector('.area-selector')?.contains(target);

  if (!clickedInside) {
    this.isAreaDrawerOpen = false;
  }
}

  // --- 串接後端：載入個人資料 ---
  loadUserProfile() {

  this.userService.getMyInfo().subscribe({
    next:(res)=>{
      if(res.statusCode === 200){
        const user = res.user;
        this.currentUserId = user.userId || user.id;
        this.name = user.userName;
        this.email = user.userEmail;
        this.school = user.school;
        this.department = user.department || '';
        this.phone = user.phone || '';
        this.profile = user.msg || '';
        this.score = user.goodLevel ;

      if (user.imgPath && user.imgPath.trim() !== '') {
          if (user.imgPath.startsWith('http')) {
            this.avatarUrl = user.imgPath; // 如果是 Cloudinary 網址，直接用！
          } else {
            this.avatarUrl = 'http://localhost:8080/uploads/' + user.imgPath;
          }
        } else {
          this.avatarUrl = 'https://res.cloudinary.com/df8kviidh/image/upload/v1780243053/default_avatar_lvgh1a.png';
        }

        // 同步通知全站右上角
        this.userService.updateAvatar(this.avatarUrl as string);

       // 2. 處理地區
        let backendAreas: string[] = [];

        if (Array.isArray(user.location)) {
          // 情境 A：後端給的是標準陣列 (例如：["臺南市"])
          backendAreas = user.location;
        } else if (user.location && typeof user.location === 'string') {
          const cleanStr = user.location.trim();

          // 情境 B：後端給的是「長得像陣列的字串」 (例如：'["臺北市"]')
          if (cleanStr.startsWith('[') && cleanStr.endsWith(']')) {
            try {
              backendAreas = JSON.parse(cleanStr);
            } catch (e) {
              // 萬一 JSON 解析失敗，用正規表達式把中括號和雙引號暴力濾掉
              backendAreas = [cleanStr.replace(/[\[\]"']/g, '')];
            }
          } else {
            // 情境 C：後端給的是最單純的純字串 (例如：'臺北市')
            backendAreas = [cleanStr];
          }
        }

        this.selectedAreas = [
          backendAreas[0] || '',
          backendAreas[1] || '',
          backendAreas[2] || ''
        ].filter(a => a !== '');

        // 3. 將資料灌進表單控制項 (FormControl)
          this.schoolControl.setValue(this.school, { emitEvent: false });
          this.deptControl.setValue(this.department, { emitEvent: false });
          this.phoneControl.setValue(this.phone, { emitEvent: false });
          this.profileControl.setValue(this.profile, { emitEvent: false });

          // 因為我們重新建立了 FormArray，所以要重新接上地區的水管！
          this.initAutocompletePipelines();
      }
    },
    error: (err) =>{
      console.error('取得個人資料失敗', err);
      this.showWarningAlert('無法載入個人資料，請稍後再試。');
    }
  });
  }

  loadMyProducts(userId: number): void {
    // 透過賣家 ID 搜尋商品的 API
    this.apiTestService.searchBySellerId(userId).subscribe({
      next: (res) => {
        if (res && res.productList) {
          this.myProducts = res.productList; // 1. 塞給卡片陣列去渲染 UI

          // 2. 直接數有幾筆卡片，就是上架數量！
          this.onTheShelves = res.productList.length;
        }
      },
      error: (err) => {
        console.error('撈取個人上架商品失敗：', err);
        this.onTheShelves = 0;
      }
    });
  }

  ngOnInit() {
    const currentUserId = this.userService.currentUser()?.userId;
    if (currentUserId) {
      this.loadMyProducts(currentUserId);
    }
    // 1. 初始化集體禁用
    this.setBasicControlsStatus(false);

    // 2. 密碼表單初始化
    this.passwordForm = this.fb.group(
      {
        oldPassword: [{ value: '', disabled: true }, [Validators.required]],
        newPassword: [
          { value: '', disabled: true },
          [Validators.required, Validators.minLength(8),Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)],
        ],
        confirmPassword: [{ value: '', disabled: true }, [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );

  // 3. 呼叫 API 載入資料
    this.loadUserProfile();
  }

  // 集體控制狀態的萬能開關工具
  private setBasicControlsStatus(enable: boolean, options = {}) {
    Object.values(this.basicControlsMap).forEach((control) => {
      if (enable) control.enable(options);
      else control.disable(options);
    });
  }

  // --- 改基本資料核心邏輯 ---
  toggleEditBasic() {
    this.isEditingBasic = !this.isEditingBasic;

    if (this.isEditingBasic) {
      // 一鍵解鎖所有控制項！
      this.setBasicControlsStatus(true);
      this.tempName = this.name;
      this.backupData = {
        avatarUrl: this.avatarUrl,
        dept: this.deptControl.value,
        phone: this.phoneControl.value,
        profile: this.profileControl.value,
        areas: [...this.selectedAreas],
      };
    } else {
      this.isEditingBasic = true;
      // 確定儲存時的前端大檢查
      if (this.validateAndMarkBasicFields()) return; // 遭攔截則中斷

      //  1. 判斷圖片狀態
      let base64Img: string | null = null;
      let isDelete = false;

      if (this.selectedAvatarFile === 'RESET_DEFAULT' as any) {
        isDelete = true;
      } else if (this.selectedAvatarFile instanceof File) {
        base64Img = this.avatarUrl as string;
      }

      //  2. 打包成 SetInfoVo 物件 (準備送給 Java)
      const updateData: SetInfoVo = {
        email: this.email,
        name: this.tempName,
        school: this.school,
        department: this.deptControl.value ?? '',
        phone: this.phoneControl.value ?? '',
        msg: this.profileControl.value ??  '',
        location: this.selectedAreas,
        img: base64Img,
        deleteImg: isDelete
      };

      Swal.fire({
        title: '資料儲存中...',
        html: '正在為您更新個人檔案，請稍候',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      //  3. 正式發送給後端！
      this.userService.updateProfile(updateData).subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            // 後端說存檔成功了！
            Swal.fire({ title: '儲存成功！', icon: 'success', confirmButtonColor: '#FB831D' });

            // 確定成功後，才一鍵集體鎖定表單並關閉編輯模式
            this.setBasicControlsStatus(false);
            this.isEditingBasic = false;

            // 數據同步：用剛剛送出去的資料，來更新畫面上的變數
            this.name = updateData.name;
            this.school = updateData.school;
            this.department = updateData.department ?? '';
            this.phone = updateData.phone  ?? '';
            this.profile = updateData.msg  ?? '';
            this.selectedAvatarFile = null;

          } else {
            // 存檔失敗 (例如名字格式錯誤)，維持編輯狀態讓使用者改
            this.showWarningAlert(res.message);
          }
        },
        error: () => {
          this.showWarningAlert('伺服器連線異常，請稍後再試！');
        }
      });
    }
  }

  /* 點擊取消修改：一鍵時空倒流 */
  cancelEditBasic() {
    this.isEditingBasic = false;
    this.setBasicControlsStatus(false);

    // 從記憶箱子倒回去
    this.avatarUrl = this.backupData.avatarUrl;
    this.userService.updateAvatar(this.backupData.avatarUrl);
    this.selectedAvatarFile = null;
    this.tempName = this.name;
    this.deptControl.setValue(this.backupData.dept, { emitEvent: false });
    this.phoneControl.setValue(this.backupData.phone, { emitEvent: false });
    this.profileControl.setValue(this.backupData.profile, { emitEvent: false });
    this.selectedAreas = [...this.backupData.areas];
  }

  // 把又臭又長的比對安檢抽出來獨立
  private validateAndMarkBasicFields(): boolean {

    // 催生紅字判定
    if (this.schoolControl.invalid || this.phoneControl.invalid) {
      this.schoolControl.markAsTouched();
      this.phoneControl.markAsTouched();
      this.showWarningAlert('欄位填寫有誤！請務必填寫必填項、確認手機格式，並確認出沒地區沒有重複選取喔！');
      this.isEditingBasic = true;
      return true;
    }

    if (!this.isAreaValid) {
      this.showWarningAlert('請至少選擇一個常出沒地區！');
      this.isEditingBasic = true;
      return true;
    }

    // 名字檢查
    const trimmedName = (this.tempName || '').trim();
    if (!trimmedName) {
      this.showWarningAlert('名稱為必填欄位，不能留空喔！');
      this.isEditingBasic = true;
      return true;
    }
    if (trimmedName.length > 20) {
      this.showWarningAlert('名稱長度不能超過 20 個字喔！');
      this.isEditingBasic = true;
      return true;
    }

    return false; // 代表完全沒問題，放行儲存
  }


  // --- 各類獨立小工具方法 (Helper Functions) ---

  private initAutocompletePipelines() {


    // 科系水管
    this.filteredDepts = this.deptControl.valueChanges.pipe(
      startWith(this.deptControl.value || ''),
      map((value) =>
        this._filter(
          value || '',
          this.schoolService.getDepartmentsBySchoolOnly(
            this.schoolControl.getRawValue(),
          ),
        ),
      ),
    );

  }

  /* 處理手機輸入與自動填入 '-' */
  onPhoneInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 2)
      value = value.substring(0, 2) + '-' + value.substring(2);
    this.phoneControl.setValue(value, { emitEvent: false });
  }

  // 萬能過濾器：支援【台/臺】繁簡通用模糊搜尋
  private _filter(value: string, options: string[]): string[] {
    const filterValue = value.toLowerCase().replace(/台/g, '臺');
    return options.filter(
      (opt) =>
        opt.toLowerCase().includes(filterValue) ||
        opt.toLowerCase().replace(/臺/g, '台').includes(value.toLowerCase()),
    );
  }

   // 驗證器：確保輸入的值必須存在於 Service 的官方清單中
  private passwordMatchValidator(control: AbstractControl) {
    const newPwd = control.get('newPassword');
    const cfPwd = control.get('confirmPassword');
    if (!newPwd || !cfPwd) return null;

    if (newPwd.value !== cfPwd.value) {
      cfPwd.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      if (cfPwd.hasError('mismatch')) {
        const errs = cfPwd.errors;
        if (errs) {
          delete errs['mismatch'];
          cfPwd.setErrors(Object.keys(errs).length ? errs : null);
        }
      }
      return null;
    }
  }



  private showWarningAlert(text: string) {
    Swal.fire({
      title: '儲存失敗',
      text,
      icon: 'warning',
      confirmButtonColor: '#FB831D',
    });
  }

  //自介縮排
  onProfileKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab') {
    event.preventDefault();  // 阻止瀏覽器原生的 Tab 跳到下一個欄位

    const textarea = event.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.profileControl.value || '';

    const indent = '　　';  // 兩個全形空格，視覺上像縮排

    const newText = text.substring(0, start) + indent + text.substring(end);

    // 檢查是否超過字數限制
    if (newText.length > 200) return;

    this.profileControl.setValue(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + indent.length, start + indent.length);
    });
  }
}

    toggleAreaDrawer() {
    if (this.isEditingBasic) {
      this.isAreaDrawerOpen = !this.isAreaDrawerOpen;
    }
  }

  toggleArea(region: string) {
    if (this.selectedAreas.includes(region)) {
      this.selectedAreas = this.selectedAreas.filter(a => a !== region);
    } else if (this.selectedAreas.length < this.MAX_AREAS) {
      this.selectedAreas = [...this.selectedAreas, region];
    }
  }

  removeArea(region: string, event: MouseEvent) {
    event.stopPropagation();
    this.selectedAreas = this.selectedAreas.filter(a => a !== region);
  }

  //更換照片
  onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || !input.files[0]) return;

  const file = input.files[0];

  if (file.size > 2 * 1024 * 1024) {
    Swal.fire({
      title: '檔案太大囉，請選擇2MB以下的圖片!',
      icon: 'warning',
      confirmButtonColor: '#FB831D',
    });
    return;
  }

  // 開啟裁切 Dialog
  const dialogRef = this.dialog.open(ImageCropDialogComponent, {
    // width: '500px',
    // maxHeight: '90vh',
    disableClose: true,
    data: { file }
  });

  dialogRef.afterClosed().subscribe((croppedBase64: string | null) => {
    if (!croppedBase64) return;  // 使用者按取消

    // 把裁切後的 base64 當作預覽圖和上傳資料
    this.avatarUrl = croppedBase64;
    this.userService.updateAvatar(croppedBase64);

    // 把 base64 轉回 File 物件（讓原本的上傳邏輯繼續運作）
    fetch(croppedBase64)
      .then(res => res.blob())
      .then(blob => {
        this.selectedAvatarFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      });
  });

  // 清空 input，讓下次選同一張圖也能觸發
  input.value = '';
}

  //恢復預設頭像
  resetToDefaultAvatar() {
    Swal.fire({
      title: '確定要恢復預設頭像嗎？',
      text: '恢復後將會使用系統初始的預設圖片喔！',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '確定恢復',
      cancelButtonText: '先不要',
      confirmButtonColor: '#FB831D',
      cancelButtonColor: '#999999',
    }).then((result) => {
      if (result.isConfirmed) {
        const defaultAvatar = 'https://res.cloudinary.com/df8kviidh/image/upload/v1780243053/default_avatar_lvgh1a.png';
        this.avatarUrl = defaultAvatar;
        this.selectedAvatarFile = 'RESET_DEFAULT' as any;
        this.userService.updateAvatar(defaultAvatar);
      }
    });
  }

//密碼確認修改按鈕
  toggleEditPassword() {
    this.isEditingPassword = !this.isEditingPassword;
    if (this.isEditingPassword) {
      this.passwordForm.enable();
    } else {
      if (this.passwordForm.invalid) {
        Swal.fire({
          title: '請檢查密碼格式，或確認兩次新密碼一致!',
          icon: 'warning',
          confirmButtonText: '知道了',
          confirmButtonColor: '#FB831D',
        });
        this.isEditingPassword = true;
        return;
      }

      const requestData: ChangePasswordVo = {
      nowPad: this.passwordForm.value.oldPassword,
      newPad: this.passwordForm.value.newPassword
      };

      this.userService.changePassword(requestData).subscribe({
        next:(res) => {
          if(res.statusCode === 200){
          Swal.fire({
            title: '密碼修改成功！',
            icon: 'success',
            confirmButtonText: '確定',
            confirmButtonColor: '#FB831D',
          });
          // 成功後才執行收尾動作 (禁用並清空密碼表單)
          this.finalizeEdit();
          }else{
            console.error('修改密碼被後端拒絕:', res.message);
            Swal.fire({
            title: '修改失敗',
            text: '舊密碼輸入錯誤，請確認後再試！',
            icon: 'error',
            confirmButtonText: '知道了',
            confirmButtonColor: '#FB831D',
          });
          this.isEditingPassword = true;
          }
        },
        error: (err) => {
        console.error('更換密碼 API 錯誤', err);
        Swal.fire('系統錯誤', '無法連線到伺服器，請稍後再試！', 'error');
        this.isEditingPassword = true;
        }
      });

      console.log('送出修改密碼請求', this.passwordForm.value);
    }
  }

  // 密碼取消修改的函式
  cancelEditPassword() {
    this.isEditingPassword = false;
    this.finalizeEdit();
  }

  // 密碼封裝重複的動作：禁用並清空
  private finalizeEdit() {
    this.passwordForm.disable();
    this.passwordForm.reset();
  }

//   gotoStore() {
//  if (this.isEditingBasic) return;
//     if (!this.currentUserId) {
//       console.warn('尚未取得使用者 ID，無法導向個人商城');
//       return;
//     }
//     this.router.navigate(['/store', this.currentUserId]);
//   }


}
