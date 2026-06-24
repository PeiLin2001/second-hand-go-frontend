import { filter } from 'rxjs';
import { ApiTestService } from './../../@Services/api-test.service';
import { UserService } from './../../@Services/user.service';
import { Component, HostListener, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule, LUCIDE_ICONS, LucideIconProvider,
  User, BookText, MapPin, School, MessageCircleMore, HeartPlus,
  Pencil, ArrowRight, Plus, ThumbsUp, Trash2, Flag, Phone, Mail,
  ChevronLeft, ChevronRight,
  Heart
} from 'lucide-angular';
import { ReportService } from '../../@Services/report.service';
import Swal from 'sweetalert2';
import { PaginationService } from '../../@Services/pageination.service';
import { CollectRes } from '../../@Interface/collect-res';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-store',
  imports: [LucideAngularModule, DecimalPipe],
  templateUrl: './store.component.html',
  styleUrl: './store.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({
        User, BookText, MapPin, School, MessageCircleMore, HeartPlus, Pencil, Heart,
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
  collectedMap = new Map<number, number>(); // productId -> collectId

  ngOnInit(): void {
    let idFromUrl = this.route.snapshot.paramMap.get('id');
    this.targetUserId = Number(idFromUrl);

    if (!idFromUrl) return;
    this.fetchShopOwnerData(this.targetUserId);
    this.fetchUserCollect();
  }

  //撈收藏清單 韻
  fetchUserCollect(): void {
    this.apiTestService.getUserCollect().subscribe({
      next: (res: CollectRes) => {
        if (res.statusCode === 200 && res.collectListVo) {
          this.collectedMap.clear();
          res.collectListVo.forEach((item: any) => {
            this.collectedMap.set(item.productId, item.collectId);
          });
        }
      },
      error: (err) => console.error('撈取收藏清單失敗：', err)
    });
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
        this.allProducts = res.productList.filter((p: any) =>
          p.status === '販售中') || [];

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
    this.router.navigate(['/launch_product_price']);
  }

  // 商品管理
  manageProduct() {
    this.router.navigate(['/draft_list']);
  }

  // 收藏商品
  goCollectProduct(productId: number): void {
    // 未登入檢查
    if (!this.userService.currentUser()) {
      Swal.fire({
        title: '收藏失敗！',
        text: '您需要先登入，才能收藏商品喔！',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '前往登入',
        cancelButtonText: '先看看就好',
        confirmButtonColor: '#EDA900',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login_register']);
        }
      });
      return;
    }
    if (!this.collectedMap.has(productId)) {
      // 加入收藏
      this.apiTestService.addCollect(productId).subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            // 加入成功後重撈，拿到新的 collectId
            this.apiTestService.getUserCollect().subscribe({
              next: (collectRes: CollectRes) => {
                const matched = collectRes.collectListVo?.find((item: any) => item.productId === productId);
                if (matched) this.collectedMap.set(productId, matched.collectId);
              }
            });
            Swal.fire({ title: '商品已收藏！', icon: 'success', timer: 1500, showConfirmButton: false });
          }
        },
        error: (err) => console.error('收藏失敗：', err)
      });
    } else {
      // 取消收藏
      const collectId = this.collectedMap.get(productId)!;
      this.apiTestService.deleteCollect([collectId]).subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            this.collectedMap.delete(productId);
            Swal.fire({ title: '已取消收藏', icon: 'info', timer: 1500, showConfirmButton: false });
          }
        },
        error: (err) => console.error('取消收藏失敗：', err)
      });
    }
  }

  // 手機打碼
  get maskedPhone(): string {
    const phone = this.shopOwnerData()?.phone;
    if (!phone) return '未填寫';

    if (phone.includes('-') && phone.length >= 11) {
      const prefix = phone.substring(0, 3);
      const suffix = phone.substring(phone.length - 3);

      return `${prefix}*****${suffix}`;
    }

    if (phone.length >= 10) {
      return `${phone.substring(0, 2)}*****${phone.substring(phone.length - 3)}`;
    }
    return phone; // 長度怪怪的就直接回傳原樣
  }

  // Email 打碼
  get maskedEmail(): string {
    const email = this.shopOwnerData()?.userEmail;
    if (!email) return '未填寫';

    const [name, domain] = email.split('@');
    if (!domain) return email; // 預防格式錯誤

    if (name.length <= 2) {
      return `*@${domain}`; // 名字太短直接變 *@domain
    } else if (name.length <= 5) {
      return `${name.substring(0, 1)}***@${domain}`;
    } else {
      return `${name.substring(0, 2)}***${name.substring(name.length - 2)}@${domain}`;
    }
  }

  // 前往商品詳情頁
  goProductPage(item: any) { this.router.navigate(['/product_page', item.productId]); }

  // 編輯個人資料
  goSettings() { this.router.navigate(['/profile_settings']); }

  // 聊聊
  chat() { this.router.navigate(['/chat', this.shopOwnerData().userId]); }

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
