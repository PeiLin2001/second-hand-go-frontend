import { ApiTestService } from './../../@Services/api-test.service';
import { UserService } from './../../@Services/user.service';
import { Component, HostListener, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule, LUCIDE_ICONS, LucideIconProvider,
  User, BookText, MapPin, School, MessageCircleMore, HeartPlus,
  Pencil, ArrowRight, Plus, ThumbsUp, Trash2, Flag, Phone, Mail,
  ChevronLeft, ChevronRight
} from 'lucide-angular';
import { ReportService } from '../../@Services/report.service';
import Swal from 'sweetalert2';
import { PaginationService } from '../../@Services/pageination.service';

@Component({
  selector: 'app-store',
  imports: [LucideAngularModule],
  templateUrl: './store.component.html',
  styleUrl: './store.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({
        User, BookText, MapPin, School, MessageCircleMore, HeartPlus, Pencil,
        ArrowRight, Plus, ThumbsUp, Trash2, Flag, Phone, Mail, ChevronLeft, ChevronRight,
      })
    }
  ]
})
export class StoreComponent {
  constructor(private router: Router,
    private reportService: ReportService,
    private userService: UserService,
    private route: ActivatedRoute,
    private apiTestService: ApiTestService,
    public pagination: PaginationService,) { }

  isGood: boolean = true;
  isOwner: boolean = false;
  shopOwnerData = signal<any>(null); // 賣場主人資料
  products: any[] = []; // 商品列表的變數
  allProducts: any[] = []; //全部商品
  pageSize = 6; // 分頁變數
  targetUserId?: number; // 賣場網址ID
  loggedInId?: number; // 使用者ID

  ngOnInit(): void {
    let idFromUrl = this.route.snapshot.paramMap.get('id');
    this.targetUserId = Number(idFromUrl);

    if (!idFromUrl) return;
    this.fetchShopOwnerData(this.targetUserId);
  }

  // 檢舉
  goRepot() {
    // 檢舉用戶
    this.reportService.openReportDialog('user', this.shopOwnerData().userName, this.shopOwnerData().userId);
  }

  // 取得賣場專屬資料與商品
  fetchShopOwnerData(userId: number) {
    this.userService.getUserData(userId).subscribe({
      next: (res) => {
        this.shopOwnerData.set(res.user);
        this.loggedInId = this.userService.currentUser()?.userId;
        this.isOwner = (userId === Number(this.loggedInId)); // 切換編輯/瀏覽模式
        this.isGood = (res.user.goodLevel > 4); // 信譽良好徽章
      },
      error: (err) => {
        console.error('撈取賣場主人資料失敗：', err);
      }
    });

    this.fetchProduct(userId);
  }

  // 取得販賣商品資訊
  fetchProduct(userId: number) {
    this.apiTestService.searchBySellerId(userId).subscribe({
      next: (res) => {
        this.allProducts = res.productList;
        this.pagination.init(this.allProducts.length, this.pageSize);  // 初始化分頁
        this.updatePaginationTotal(); // 切出當頁
      },
      error: (err) => { console.error('撈取商品失敗：', err); }
    });

  }

  // 處理地區陣列 (有空再看看能不能重構)
  get formattedLocation(): string {
    const user = this.shopOwnerData();
    if (!user || !user.location) return '未填寫';

    // 🕵️ 抓漏核心：判斷後端給的到底是不是陣列
    if (Array.isArray(user.location)) {
      // 如果是陣列型態，用「、」把牠們手牽手串起來
      return user.location.join('、');
    }

    // 防禦機制：萬一後端有時候給的是字串 JSON (長得像陣列的字串)，試著解析它
    if (typeof user.location === 'string' && user.location.startsWith('[')) {
      try {
        const parsed = JSON.parse(user.location);
        if (Array.isArray(parsed)) {
          return parsed.join('、');
        }
      } catch (e) {
        // 解析失敗就保持原樣
      }
    }

    // 如果本來就是純字串（例如 "高雄市"），就直接回傳
    return user.location;
  }

  // 新增商品
  goLaunchProduct() {
    this.router.navigate(['/launch_product_info']);
  }

  // 商品管理
  manageProduct() {
    this.router.navigate(['/draft_list']);
  }

  // 收藏商品
  goCollectProduct(productId: number) {
    this.apiTestService.addCollect(productId).subscribe({
      next: (res) => {
        Swal.fire({
          title: '商品已收藏！',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        })
      },
      error: (err) => {
        console.error('收藏商品失敗：', err);
        Swal.fire({
          title: '商品收藏失敗！',
          text: '請稍後再試！',
          icon: 'error',
          timer: 1500,
          showConfirmButton: false,
        })
      }
    })
  }

  // 前往商品詳情頁
  goProductPage() { this.router.navigate(['/product_page']); }

  // 編輯個人資料
  goSettings() { this.router.navigate(['/profile_settings']); }

  // 聊聊
  chat() { this.router.navigate(['/chat']); }

  // 分頁
  prevPage() {
    this.pagination.prevPage();
    this.updatePaginationTotal();
  }
  nextPage() {
    this.pagination.nextPage();
    this.updatePaginationTotal();
  }
  goToPage(page: number) {
    this.pagination.goToPage(page);
    this.updatePaginationTotal();
  }
  private updatePaginationTotal() {
    const start = (this.pagination.currentPage - 1) * this.pageSize;
    this.products = this.allProducts.slice(start, start + this.pageSize);
  }
}
