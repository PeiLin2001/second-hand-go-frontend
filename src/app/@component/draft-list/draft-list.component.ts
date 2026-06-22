import { Component, effect } from '@angular/core';
import { Router } from '@angular/router';
import { LaunchProductFormService } from '../../@Services/launch-product-form.service';
import { UserService } from '../../@Services/user.service';
import { PaginationService } from '../../@Services/pageination.service';
import {
  LucideAngularModule, LUCIDE_ICONS, LucideIconProvider,
  ChevronRight, ChevronLeft, Search,
} from 'lucide-angular';
import { FormsModule } from '@angular/forms';

// 對應後端 Product Entity
interface Product {
  productId: number;
  userId: number;
  productName: string;
  description: string;
  price: number;
  imgPath: string;
  type: string;
  shelfDate: string;
  productCondition: string;
  status: string;
  grade: string;
  location: string;
  deptGroup: string;
}

@Component({
  selector: 'app-draft-list',
  imports: [LucideAngularModule, FormsModule],
  templateUrl: './draft-list.component.html',
  styleUrl: './draft-list.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({ ChevronRight, ChevronLeft, Search })
    }
  ]
})
export class DraftListComponent {

  // tabs
  currentTab = '全部商品'; // 預設選中
  tabsColumns: string[] = [
    '全部商品',
    '已上架',
    '草稿',
    '已下架',
    '交易中',
  ];
  // tab 對應 status
  statusMap: Record<string, string> = {
    全部商品: '',
    已上架: '販售中',
    草稿: '未上架',
    已下架: '已下架',
    交易中: '交易中',
  };

  // ── Toast ──
  toastText = '';
  toastVisible = false;
  private toastTimer: any;

  allProducts: Product[] = [];
  showConfirm = false;
  userId?: number;
  keyword = ''; // 搜尋

  private pendingDeleteId: number | null = null;

  // 分頁變數
  readonly pageSize = 5;
  filteredTotalCount = 0;

  constructor(
    private formService: LaunchProductFormService,
    private router: Router,
    private userService: UserService,
    public pagination: PaginationService,
  ) {
    effect(() => {
      const user = this.userService.currentUser();
      if (user?.userId) {
        this.userId = user.userId;
        this.fetchProduct(Number(user.userId));
      }
    });
  }

  // 取得商品資訊
  fetchProduct(userId: number): void {
    this.formService.searchBySellerId(userId).subscribe({
      next: (res) => {
        this.allProducts = res.productList;
        this.allProducts.sort((a, b) => b.productId - a.productId);
        this.updatePaginationTotal(); // 初始化分頁器
      },
      error: (err) => console.error('取得商品資訊失敗:', err)
    });
  }

  // 分頁
  prevPage(): void { this.pagination.prevPage(); }
  nextPage(): void { this.pagination.nextPage(); }
  goToPage(page: number): void { this.pagination.goToPage(page); }

  // 更新分頁總數（依目前 tab + 關鍵字篩選後的總筆數）
  private updatePaginationTotal(): void {
    const filteredTotal = this.getFilteredList().length;
    this.pagination.init(filteredTotal, this.pageSize);
  }

  private matchesTab(product: Product): boolean {
    const targetStatus = this.statusMap[this.currentTab];
    return targetStatus === '' || product.status === targetStatus;
  }

  private matchesKeyword(product: Product): boolean {
    const keyword = this.keyword.toLowerCase().trim();
    if (!keyword) return true;
    const nameMatch = product.productName?.toLowerCase().includes(keyword);
    const idMatch = product.productId?.toString().includes(keyword);
    return !!(nameMatch || idMatch);
  }

  // 統一篩選：tab + 關鍵字，兩者都套用同一份結果，分頁也基於這份結果計算
  private getFilteredList(): Product[] {
    return this.allProducts.filter(p => this.matchesTab(p) && this.matchesKeyword(p));
  }

  // 統一列表：依目前 tab + 關鍵字篩選 + 分頁切片
  filteredOrders(): Product[] {
    const filtered = this.getFilteredList();
    this.filteredTotalCount = filtered.length;

    const start = (this.pagination.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  onSearchChange() {
    this.updatePaginationTotal();
    this.pagination.goToPage(1);
  }

  changeTab(tabName: string): void {
    this.currentTab = tabName;
    this.updatePaginationTotal(); // 重新計算總頁數
    this.pagination.goToPage(1); // 回第一頁
  }

  get isAllTab(): boolean { return this.currentTab === '全部商品'; }
  get isPublishedTab(): boolean { return this.currentTab === '已上架'; }
  get isDraftTab(): boolean { return this.currentTab === '未上架'; }

  goAddProduct(): void {
    this.router.navigate(['/launch_product_price']);
  }

  // 草稿「繼續編輯」
  onLoad(productId: number): void {
    this.router.navigate(['/launch_product_price'],
      { queryParams: { productId: productId } });
  }

  // 防呆刪除（用於草稿刪除）
  onDelete(id: number): void {
    this.pendingDeleteId = id;
    this.showConfirm = true;
  }

  // 確認刪除
  confirmDelete() {
    if (this.pendingDeleteId !== null) {
      this.formService.deleteById(this.pendingDeleteId).subscribe({
        next: (res) => {
          console.log('刪除:', res);
          this.fetchProduct(this.userId!);
        },
        error: (err) => console.error('刪除商品失敗:', err)
      })
    }
    this.showConfirm = false;
    this.pendingDeleteId = null;
  }

  cancelDelete(): void {
    this.showConfirm = false;
    this.pendingDeleteId = null;
  }

  onUnpublish(productId: number) {
    this.formService.unpublishById(productId).subscribe({
      next: (res) => {
        console.log('下架:', res);
        this.fetchProduct(this.userId!);
      },
      error: (err) => console.error('下架商品失敗:', err)
    })
  }

  // 重新上架
  onRepublish(productId: number): void {
    this.formService.publishProduct(productId).subscribe({
      next: (res) => {
        console.log('重新上架:', res);
        this.showToast('✓ 商品已重新上架');
        this.fetchProduct(this.userId!);
      },
      error: (err) => console.error('重新上架失敗:', err)
    });
  }

  // 交易中商品
  goToOrders(productName: String): void {
    this.router.navigate(['/order_information'], { queryParams: { targetProductName: productName } });
  }

  // 顏色
  getStatusColor(status: string): string {
    switch (status) {
      case '販售中':
        return '#5E9759'; // 綠色
      case '已下架': case '未上架':
        return '#8c8c8c'; // 灰色
      case '交易中':
        return '#FB831D'; // 橘色
      default:
        return '#000000'; // 預設黑色
    }
  }

  showToast(msg: string): void {
    this.toastText = msg;
    this.toastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 1500);
  }
}
