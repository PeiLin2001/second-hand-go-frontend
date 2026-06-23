import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LaunchProductFormService } from '../../@Services/launch-product-form.service';
import { UserService } from '../../@Services/user.service';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-launch-product-info',
  imports: [FormsModule],
  templateUrl: './launch-product-info.component.html',
  styleUrl: './launch-product-info.component.scss'
})
export class LaunchProductInfoComponent implements OnInit {

  // 屬性：下拉選單選取項陣列
  catOptions = ['教科書', '專業器材', '生活用品', '3C電子', '家具家電', '筆記考古', '服飾配件', '戶外運動', '畢業季'];
  regionOptions = ['基隆市', '台北市', '新北市', '桃園縣', '新竹市', '新竹縣', '苗栗縣',
    '台中市', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '台南市',
    '高雄市', '屏東縣', '台東縣', '花蓮縣', '宜蘭縣', '澎湖縣', '金門縣', '連江縣'];

  // ── 適用學群選項
  deptGroupOptions: string[] = ['資訊學群', '工程學群', '數理化學群', '醫藥衛生學群', '生命科學學群', '生物資源學群',
    '地球與環境學群', '建築與設計學群', '藝術學群', '社會與心理學群', '大眾傳播學群', '外語學群', '文史哲學群', '教育學群',
    '法政學群', '管理學群', '財經學群', '遊憩與運動學群'];

  // 年級清單
  gradeList: string[] = ['大一', '大二', '大三', '大四以上', '碩士', '博士', '不分年級'];

  // 類別相關
  customCatInput = '';
  customCatChecked = false;

  isNextDisabled = true;

  //點選沒填會亮紅邊
  touched = {
    locationRegions: false,
    grades: false,
    catMain: false,
    condition: false,
    deptGroup: false,
  };

  dialogVisible = false;
  isUpdate: boolean = false;

  // 透過 Getter 取得 Service 中的共用資料狀態
  get state() {
    return this.formService.state;
  }


  get imageSlotUrls(): string[] {
    return this.state.imageSlotUrls;
  }

  // ── Toast ──
  toastText = '';
  toastVisible = false;
  private toastTimer: any;

  constructor(
    private router: Router,
    private formService: LaunchProductFormService,
    private userService: UserService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    // 還原自訂類別狀態：若 state.catMain 裡有不在 catOptions 的值，代表有自訂
    const custom = this.state.catMain.find(c => !this.catOptions.includes(c));
    if (custom) {
      this.customCatChecked = true;
      this.customCatInput = custom;
    }
    this.updateNextButton();
  }

  // ── 核心驗證：加入地區判定 ──
  isStep1Valid(): boolean {
    return (
      this.state.locationRegions.length > 0 &&
      this.state.grades.length > 0 &&
      this.state.catMain.length > 0 &&
      !(this.customCatChecked && this.customCatInput.trim() === '') && // 勾了新增但沒填
      this.state.condition !== '' &&
      this.state.deptGroup.length > 0
    );
  }

  updateNextButton(): void {
    this.isNextDisabled = !this.isStep1Valid();
  }

  //可面交地區 Checkbox
  onLocationRegionChange(event: Event, region: string): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.state.locationRegions = [...this.state.locationRegions, region];
    } else {
      this.state.locationRegions = this.state.locationRegions.filter(r => r !== region);
    }
    this.touched.locationRegions = true;
    this.updateNextButton();
  }

  // ── 年級 Checkbox 複選處理 ──
  onGradeChange(event: Event, grade: string): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (grade === '不分年級') {
        // 如果選了「不分年級」，直接清空其餘選項，只保留不分年級
        this.state.grades = ['不分年級'];
      } else {
        // 如果選了常規年級，先剔除「不分年級」再加入新勾選項
        const filtered = this.state.grades.filter(g => g !== '不分年級');
        this.state.grades = [...filtered, grade];
      }
    } else {
      this.state.grades = this.state.grades.filter(g => g !== grade);
    }
    this.touched.grades = true;
    this.updateNextButton();
  }

  // 預設分類 checkbox
  onCatChange(event: Event, cat: string): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.state.catMain = [...this.state.catMain, cat];
    } else {
      this.state.catMain = this.state.catMain.filter(c => c !== cat);
    }
    this.touched.catMain = true;
    this.updateNextButton();
  }

  // 新增類別 checkbox 勾選/取消
  onCustomCatCheckChange(event: Event): void {
    this.customCatChecked = (event.target as HTMLInputElement).checked;
    if (!this.customCatChecked) {
      // 取消時，把舊的自訂值從 catMain 移除
      this.state.catMain = this.state.catMain.filter(c => this.catOptions.includes(c));
      this.customCatInput = '';
    }
    this.touched.catMain = true;
    this.updateNextButton();
  }

  // 新增類別文字輸入
  onCustomCatInput(): void {
    // 先移除舊的自訂值，再加入新的
    const base = this.state.catMain.filter(c => this.catOptions.includes(c));
    if (this.customCatInput.trim()) {
      this.state.catMain = [...base, this.customCatInput.trim()];
    } else {
      this.state.catMain = base; // 還沒打字時暫時不加入，讓驗證擋住
    }
    this.updateNextButton();
  }

  // 學群
  onDeptGroupChange(event: Event, dept: string): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.state.deptGroup = [...this.state.deptGroup, dept];
    } else {
      this.state.deptGroup = this.state.deptGroup.filter(d => d !== dept);
    }
    this.touched.deptGroup = true;
    this.updateNextButton();
  }


  onConditionChange(event: Event): void {
    this.state.condition = (event.target as HTMLSelectElement).value;
    this.touched.condition = true;
    this.updateNextButton();
  }

  onPriceInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.state.price = value ? Number(value) : 0;
    this.updateNextButton();
  }

  // 儲存草稿
  onSaveDraft() {
    if (this.formService.isUpdate()) {
      this.formService.updateProduct(this.formService.toProductReq(this.state)).subscribe({
        next: (res) => { this.showToast('✓ 草稿已儲存'); },
        error: (err) => console.error('儲存草稿失敗:', err)
      })
    } else {
      this.formService.addProduct(this.formService.toProductReq(this.state)).subscribe({
        next: (res) => {
          this.formService.markAsCreated(res.productId);
          this.showToast('✓ 草稿已新增');
        },
        error: (err) => console.error('新增草稿失敗:', err)
      })
    }
  }

  // 好像沒用到先註解掉 by.絲絨
  // onNewProduct(): void {
  //   this.formService.resetState(); // 確保 currentDraftId 被清掉
  //   this.router.navigate(['/launch_product_price']);
  // }

  // 下一步
  onNextClick(): void {
    if (this.isNextDisabled) {
      const missing: string[] = [];
      if (this.state.locationRegions.length === 0) missing.push('可面交地區');
      if (this.state.grades.length === 0) missing.push('建議面交年級');
      if (this.state.catMain.length === 0) missing.push('分類');
      if (!this.state.condition) missing.push('商品狀況');
      this.showToast(`請檢查：${missing.join('、')}`);
      return;
    }
    // 所有欄位都填好了，打開預覽 dialog
    this.dialogVisible = true;
  }

  // 返回：關閉 dialog，留在原頁
  onDialogCancel(): void {
    this.dialogVisible = false;
  }

  // 點擊背景也能關閉
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.dialogVisible = false;
    }
  }

  // 確認上架
  async onDialogConfirm(): Promise<void> {
    this.dialogVisible = false;
    const userId = Number(this.userService.currentUser().userId);
    const req = this.formService.toProductReq(this.state);

    const saveObservable = this.formService.isUpdate()
      ? this.formService.updateProduct(req)
      : this.formService.addProduct(req);

    saveObservable.subscribe({
      next: (res) => {
        let productId: number;
        if (this.formService.isUpdate()) {
          productId = this.state.productId;
        } else {
          productId = res.productId;
          this.formService.markAsCreated(res.productId);
        }

        this.formService.publishProduct(productId).subscribe({
          next: (pubRes) => {
            if (res.code !== 200) {
              Swal.fire({ title: '上架失敗', text: '上架失敗，請稍後嘗試', icon: 'error' });
              return;
            }
            Swal.fire({ title: '商品已上架！', icon: 'success', timer: 2000, showConfirmButton: false });
            this.formService.resetState();
            this.router.navigate(['/store', userId]);
          },
          error: (err) => console.error('上架商品失敗:', err)
        });
      },
      error: (err) => console.error('儲存商品失敗:', err)
    });
  }

  //dialog 填入的圖片清單
  get filledImages(): string[] {
    return this.imageSlotUrls.filter(url => url !== '');
  }

  showToast(msg: string): void {
    this.toastText = msg;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 1500);
  }

  // ── 路由切換（上一步 / 下一步：上架） ──
  onPrevClick(): void {
    // 回到第一步，Service 內的資料會留著
    this.router.navigate(['/launch_product_price']);
  }

}
