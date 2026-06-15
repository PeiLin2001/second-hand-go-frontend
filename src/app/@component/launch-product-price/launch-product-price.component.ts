import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LaunchProductFormService } from '../../@Services/launch-product-form.service';
import { UserService } from '../../@Services/user.service';



@Component({
  selector: 'app-launch-product-price',
  imports: [NgFor, NgIf],
  templateUrl: './launch-product-price.component.html',
  styleUrl: './launch-product-price.component.scss'
})
export class LaunchProductPriceComponent implements OnInit {

  touched = {
    mainImage: false,
    name: false,
    desc: false,
    price: false,
  };

  // 透過 Getter 取得 Service 中的共用資料狀態
  get state() {
    return this.formService.state;
  }

  // 畫面圖片預覽容器（共 7 個槽位，0為主圖，1~6為副圖），直接用 Service 的
  get imageSlotUrls(): string[] {
    return this.state.imageSlotUrls;
  }

  set imageSlotUrls(val: string[]) {
    this.state.imageSlotUrls = val;
  }
  private currentActiveSlotIndex = 0;
  // 副圖槽位索引（給 *ngFor 用）
  subSlotIndices = [1, 2, 3, 4, 5, 6];

  //隨意拖曳
  dragFromIndex = -1;
  dragOverIndex = -1;

  // 按鈕狀態驗證
  isNextDisabled = true;

  // === 從 step1 移入：價格 & AI ===
  aiBoxText = 'AI 推薦：點擊下方按鈕將為您評估合適的二手轉售價';
  aiHasContent = false;
  aiLoading = false;
  aiLabel = '一鍵評估推薦價格';
  private aiPendingPrice = 0;
  private readonly API_MODEL = 'claude-sonnet-4-20250514';



  // Toast 提示框
  toastText = '';
  toastVisible = false;
  private toastTimer: any;

  constructor(
    private router: Router,
    private formService: LaunchProductFormService,
    private userService: UserService

  ) { }

  ngOnInit(): void {
    // 初始化時，如果 Service 內本來就有暫存文字，可以同步觸發驗證
    this.updateNextButtonStatus();
  }

  //html的trim 移到 ts
  get nameMissing(): boolean {
    return !this.state.name || this.state.name.trim().length === 0;
  }

  get descTooShort(): boolean {
    return !this.state.desc || this.state.desc.trim().length < 1;
  }

  // ── 字數統計控制項 ──
  get nameCount(): string {
    return `${this.state.name?.length || 0}/60`;
  }

  get descCount(): string {
    return `${this.state.desc?.length || 0}/500`;
  }

  get descCountColor(): string {
    return (this.state.desc?.length || 0) < 1 ? '#ff4d4f' : 'var(--text-muted, #8c8c8c)';
  }

  // ── 圖片上傳邏輯 ──
  onSlotClick(index: number): void {
    this.currentActiveSlotIndex = index;
    this.touched.mainImage = true;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(input.files);
      input.value = ''; // 清空 input 讓同一張圖可重複觸發 change
    }
  }

  // 拖曳上傳支援
  onDragStart(event: DragEvent, index: number): void {
    // 只有有圖片的槽才能拖曳
    if (!this.imageSlotUrls[index]) {
      event.preventDefault();
      return;
    }
    this.dragFromIndex = index;
    event.dataTransfer?.setData('text', String(index));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault(); // 允許 drop
    const slot = (event.currentTarget as HTMLElement);
    const index = this.getSlotIndex(slot);
    this.dragOverIndex = index;
  }

  onDragLeave(event: DragEvent): void {
    this.dragOverIndex = -1;
  }

  onSortDrop(event: DragEvent, toIndex: number): void {
    event.preventDefault();
    event.stopPropagation(); // 避免觸發外層的檔案上傳 drop
    this.dragOverIndex = -1;

    const fromIndex = this.dragFromIndex;
    if (fromIndex === -1 || fromIndex === toIndex) return;

    // 交換兩個槽位的圖片
    const temp = this.imageSlotUrls[fromIndex];
    this.imageSlotUrls[fromIndex] = this.imageSlotUrls[toIndex];
    this.imageSlotUrls[toIndex] = temp;

    // 交換後確保空格仍在後方（遞補邏輯）
    this.compactSlots();

    this.dragFromIndex = -1;
    this.updateNextButtonStatus();
  }

  // 交換後重新整理，確保有圖的槽位永遠靠前
  private compactSlots(): void {
    const filled = this.imageSlotUrls.filter(url => url !== '');
    const empty = this.imageSlotUrls.filter(url => url === '');
    this.imageSlotUrls = [...filled, ...empty];
  }

  // 從 DOM 元素取得槽位 index（輔助方法）
  private getSlotIndex(el: HTMLElement): number {
    const indexAttr = el.getAttribute('data-index');
    return indexAttr !== null ? Number(indexAttr) : -1;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFiles(event.dataTransfer.files);
    }
  }

  private processFiles(files: FileList): void {
    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        this.showToast('單張圖片不能超過 2MB');
        return;
      }

      // 判斷點選的槽位是否已有圖（覆蓋模式）
      const clickedSlot = this.currentActiveSlotIndex;
      const isOverwrite = this.imageSlotUrls[clickedSlot] !== '';

      let targetSlot: number;

      if (isOverwrite) {
        // 點選已有圖的格子 → 直接覆蓋該格，不往後找
        targetSlot = clickedSlot;
      } else {
        // 點選空格 → 無論點哪格，永遠從 index 0 開始找第一個空槽
        targetSlot = this.imageSlotUrls.findIndex(url => url === '');
        if (targetSlot === -1) {
          this.showToast('最多只能上傳 7 張圖片');
          return;
        }
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imageSlotUrls[targetSlot] = e.target?.result as string;
        this.updateNextButtonStatus();
      };
      reader.readAsDataURL(file);
    });
  }

  deleteImage(event: Event, index: number): void {
    event.stopPropagation(); // 防止觸發點擊格子的上傳事件
    // 從刪除的位置開始，後面的圖片依序往前遞補
    for (let i = index; i < this.imageSlotUrls.length - 1; i++) {
      this.imageSlotUrls[i] = this.imageSlotUrls[i + 1];
    }
    // 最後一格清空
    this.imageSlotUrls[this.imageSlotUrls.length - 1] = '';

    this.updateNextButtonStatus();
  }

  // ── 欄位輸入事件 ──
  onNameInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.state.name = value;
    this.touched.name = true;
    this.updateNextButtonStatus();
  }

  onDescInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.state.desc = value;
    this.touched.desc = true;
    this.updateNextButtonStatus();
  }

  // ── 核心驗證：主圖必填、名稱必填、描述滿30字才亮燈 ──
  isStep2Valid(): boolean {
    const hasMainImage = !!this.imageSlotUrls[0]; // 檢查第 0 個槽位是否有圖片
    const hasName = !!this.state.name && this.state.name.trim().length > 0;
    const hasDescValid = !!this.state.desc && this.state.desc.trim().length >= 1;
    const hasPrice = this.state.price > 0;

    return hasMainImage && hasName && hasDescValid && hasPrice;
  }

  updateNextButtonStatus(): void {
    this.isNextDisabled = !this.isStep2Valid();
  }


  // AI
  onPriceInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.state.price = value ? Number(value) : 0;
    this.touched.price = true;
    this.updateNextButtonStatus();
  }

  private buildProductContext(): string {
    return `分類：${this.state.catMain || '未定'}\n狀況：${this.state.condition || '未定'}`;
  }
  // private buildProductContext(): string {
  //   return `分類：${this.state.catMain || '未定'}\n子分類：${this.state.catSub || '未定'}\n狀況：${this.state.condition || '未定'}`;
  // }

  async handleAIGenerate(): Promise<void> {
    if (this.aiPendingPrice > 0) {
      this.applyPrice(this.aiPendingPrice);
      return;
    }
    this.aiLoading = true;
    this.aiLabel = '價格評估中…';
    this.aiHasContent = false;
    this.aiBoxText = '';

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.API_MODEL,
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `你是一位二手校園交易專家。根據以下商品分類與狀況，請給出一個合理的建議轉售價格數字（新台幣）。\n\n${this.buildProductContext()}\n\n請以如下格式輸出，不要有任何額外廢話：\n建議價格：NT$ [數字]\n原因簡述：[一句話說明]`,
          }],
        }),
      });
      const data = await response.json();
      const text: string = data?.content?.[0]?.text ?? '無法取得建議';
      this.aiBoxText = text;
      this.aiHasContent = true;

      const priceMatch = text.match(/建議價格：\s*NT\$\s*(\d+)/i) || text.match(/(\d+)/);
      if (priceMatch?.[1]) {
        this.aiPendingPrice = Number(priceMatch[1]);
        this.aiLabel = `一鍵套用價格 NT$ ${this.aiPendingPrice}`;
      } else {
        this.aiLabel = '一鍵評估推薦價格';
      }
    } catch {
      this.aiBoxText = '系統繁忙，請稍後再試';
      this.aiLabel = '一鍵評估推薦價格';
    } finally {
      this.aiLoading = false;
    }
  }

  private applyPrice(price: number): void {
    this.state.price = price;
    this.updateNextButtonStatus();
    this.showToast(`✓ 已成功套用推薦價格：${price} 元`);
    this.aiPendingPrice = 0;
    this.aiLabel = '一鍵評估推薦價格';
  }


  // ── Toast 訊息提示 ──
  showToast(msg: string): void {
    this.toastText = msg;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 1500
    );
  }
  // 下一步
  onNextClick(): void {
    if (this.isNextDisabled) return;
    this.router.navigate(['/launch_product_info']);
  }

  // 儲存草稿
  async onSaveDraft(): Promise<void> {
    const userId = Number(this.userService.currentUser().userId);
    await this.formService.saveDraft(userId);
    this.showToast('✓ 草稿已儲存');
  }

}
