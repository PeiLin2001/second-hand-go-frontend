import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { LucideAngularModule,Home, MessageCircleMore, HeartIcon, Send, ChevronLeft, ChevronRight, Flag, Heart, Check, Store, ChevronDown, ChevronUp, MoreVertical, Copy, ShieldCheck } from 'lucide-angular';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../@Services/user.service';
import { ReportService } from '../../@Services/report.service';
import { ApiTestService, OrderVo } from '../../@Services/api-test.service';
import { ProductVo, GetProductDataRes } from '../../@Interface/product-vo';
import { OrderRes } from '../../@Interface/order';
import { BasicResponse } from '../../@Interface/user';
import { CollectRes } from '../../@Interface/collect-res';


  const CATEGORY_MAP: Record<string, string> = {
  'all':         '全部商品',
  'books':       '教科書',
  'equipment':   '專業器材',
  'daily':       '生活用品',
  'electronics': '3C電子',
  'furniture':   '家具家電',
  'notes':       '筆記考古',
  'fashion':     '服飾配件',
  'sports':      '戶外運動',
  'graduation':  '畢業季',
};

@Component({
  selector: 'app-product-page',
  imports: [CommonModule,RouterLink, CurrencyPipe, LucideAngularModule],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.scss'
})
export class ProductPageComponent {

  readonly HomeIcon          = Home;
  readonly HeartIcon         = Heart;
  readonly SendIcon    = Send;
  readonly MessageCircleIcon = MessageCircleMore;
  readonly ChevronLeftIcon   = ChevronLeft;
  readonly ChevronRightIcon  = ChevronRight;
  readonly Flag              = Flag;
  readonly CheckIcon         = Check;
  readonly StoreIcon         = Store;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  readonly MoreVertical = MoreVertical;
  readonly Copy = Copy;
  readonly ShieldCheckIcon = ShieldCheck;

  // 抓取 HTML 中的滾動區域
  @ViewChild('thumbViewport') thumbViewport!: ElementRef<HTMLDivElement>;
  @ViewChild('descText') descText!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    public userService: UserService,
    private router: Router,
    private reportService: ReportService,
    private apiTestService: ApiTestService) {}

  // 等待後端回傳的 JSON 資料
  product: ProductVo | null = null;
  sellerProductCount: number | null = null; //用來裝從同學 API 借來的「總上架件數」
  currentCollectId: number | null = null;// 用來存目前這筆「收藏紀錄」的流水號 ID
  breadcrumbLabel = ''; // 用來存麵包屑要顯示的文字（學校名或分類名）
  breadcrumbUrl = '';   // 用來存麵包屑點擊後要回跳的網址路徑
  selectedImageIndex = 0;
  isExpanded = false; //控制商品說明是否展開
  isOverflowing = false; // 用來決定要不要顯示[查看更多]按鈕
  isCollected = false; // 是否已收藏
  isRequested = false; // 是否已發送請求
  isMenuOpen = false; //檢舉分享選單

  // 自動偵測目前瀏覽的商品是不是登入者自己的
  get isOwnProduct(): boolean {
    if (!this.product) return false;
    const currentUserId = this.userService.currentUser()?.userId;
    // 2. 精準對比目前登入者 ID 與商品賣家的 ID
   return this.product.userId === currentUserId;
  }


  ngOnInit(): void {
    this.loadProductAndInitDefenses();
  }

  /**
   * 主控官：負責撈取商品詳情，並在成功後指揮所有初始化任務
   */
  private loadProductAndInitDefenses(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    if (!productId) return;

    this.apiTestService.searchByProductId(productId).subscribe({
      next: (res: GetProductDataRes) => {
        if (res.statusCode === 200 && res.productList?.length > 0) {
          this.product = res.productList[0];

          this.initBreadcrumbNavigation();                // 1. 執行智慧網址探針
          this.checkIfUserAlreadyRequested();             // 2. 啟動重整重複購買防線
          this.fetchSellerProductsAndCount(this.product.userId); // 3. 撈取賣家總上架數
          this.triggerDescriptionOverflowCheck();         // 4. 檢查商品說明是否過長
          this.checkIfProductIsCollected();               // 5. 檢查目前商品是否已被收藏

        } else {
          Swal.fire('查無商品', '該商品可能已經下架，或是不存在喔！', 'warning');
        }
      },
      error: (err) => {
        console.error('撈取商品詳細失敗：', err);
        Swal.fire('連線失敗', '系統無法載入商品資訊，請稍後再試', 'error');
      }
    });
  }

  //任務一：智慧網址探針，根據上一頁腳印計算麵包屑文字與路由
  private initBreadcrumbNavigation(): void {
    if (!this.product) return;

    let prevUrlPath = '';
    const nav = (window as any).navigation;
    if (nav) {
      const currentIndex = nav.currentEntry?.index;
      if (currentIndex !== undefined && currentIndex > 0) {
        const fullUrl = nav.entries()[currentIndex - 1]?.url || '';
        prevUrlPath = new URL(fullUrl).pathname;
      }
    }

    if (prevUrlPath.includes('/school-community/')) {
      this.breadcrumbLabel = this.product.seller.school;
      this.breadcrumbUrl = prevUrlPath;
    } else if (prevUrlPath.includes('/product-list/')) {
      const urlSegments = prevUrlPath.split('/');
      const categorySlug = urlSegments[urlSegments.length - 1];
      const matchedChineseName = CATEGORY_MAP[categorySlug];

      if (matchedChineseName && this.product.type.includes(matchedChineseName)) {
        this.breadcrumbLabel = matchedChineseName;
      } else if (categorySlug === 'all') {
        this.breadcrumbLabel = '全部商品';
      } else {
        this.breadcrumbLabel = this.product.type[0];
      }
      this.breadcrumbUrl = prevUrlPath;
    }else if (prevUrlPath.includes('/store/')){
      const sellerName = this.product.seller?.userName || '賣家';
      this.breadcrumbLabel = `${sellerName} 的賣場`;
      this.breadcrumbUrl = prevUrlPath;
    } else {
      this.breadcrumbLabel = this.product.type[0];
      this.breadcrumbUrl = this.getCategoryRoute(this.product.type[0]);
    }
  }

  // 任務二：終極重整防線，檢查當前登入者是否已對此商品發送過請求
  private checkIfUserAlreadyRequested(): void {
    if (!this.product) return;

    this.apiTestService.getProductAllOrder(this.product.productId).subscribe({
      next: (orderRes: OrderRes) => {
        if (orderRes && orderRes.orderList) {
          const currentUserName = this.userService.currentUser()?.userName;

          const isIHaveRequested = orderRes.orderList.some(order =>
            order.buyerName === currentUserName &&
            order.status === '請求回應中'
          );

          if (isIHaveRequested) {
            this.isRequested = true; // 變灰鎖定
          }
        }
      },
      error: (err) => {
        console.error('初始化檢查商品訂單失敗：', err);
      }
    });
  }

  allProducts: any[] = []; //全部商品

// 任務三 : 一條水管，同時拿到「總件數」和「商品卡片清單」
  fetchSellerProductsAndCount(userId: number): void {
    this.apiTestService.searchBySellerId(userId).subscribe({
      next: (res) => {
        if (res && res.productList) {
          this.allProducts = res.productList;             // 1. 拿去渲染「賣家其他商品」卡片清單
          this.sellerProductCount = res.productList.length; // 2. 拿去渲染「總上架件數」的數字
        }
      },
      error: (err) => {
        console.error('撈取賣家相關商品失敗：', err);
        this.sellerProductCount = 0;
      }
    });
  }

  //任務四：觸發非同步排版，檢查文字是否超出顯示範圍
  private triggerDescriptionOverflowCheck(): void {
    setTimeout(() => this.checkTextOverflow(), 300);
  }



 // 6. 圖片篩選功能大瘦身！因為後端已經是 List<String> 陣列，不需要再用逗號切開了！
  get validImages(): string[] {
    return this.product?.imgPath ?? []; // 防呆：如果 product 還沒回來，先給空陣列
  }

  // 取得當前選中的主圖
  get selectedImage(): string {
    return this.validImages[this.selectedImageIndex] || '';
  }

  // 切換縮圖
  selectImage(index: number): void {
if (index >= 0 && index < this.validImages.length) {
      this.selectedImageIndex = index;
    }
  }

    ngAfterViewInit() {
    setTimeout(() => {
      this.checkTextOverflow();
    });
  }

//檢查是否要顯示 查看更多 按鈕
  checkTextOverflow() {
    if (this.descText && this.descText.nativeElement) {
      const element = this.descText.nativeElement;

      // 取得這段文字「真實」長出的總高度
      const actualHeight = element.scrollHeight;
      const maxAllowedHeight = 110;

      // 如果真實高度大於 4 行的高度，isOverflowing 就會變成 true！
      this.isOverflowing = actualHeight > maxAllowedHeight;
    }
  }


  //切換展開/收起狀態
  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

/**
   * 核心控制：點擊箭頭滑動縮圖
   * @param direction 'left' 或 'right'
   */
  scrollThumbnails(direction: 'left' | 'right'): void {
    const viewport = this.thumbViewport.nativeElement;
    // 一個縮圖 54px + gap 8px = 62px，每次移動一個縮圖的距離
    const scrollAmount = 62;
    if (direction == 'left') {
      viewport.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      viewport.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  //type標籤連結
  getCategoryRoute(categoryName: string): string {
    // 透過 Object.keys 尋找哪一個「英文 Key」對應的「中文 Value」等於我們傳進來的 categoryName
    const routePath = Object.keys(CATEGORY_MAP).find(
      (key) => CATEGORY_MAP[key] === categoryName
    );

    // 如果有找到就跳轉過去，沒找到（防呆）就預設導向所有商品列表
    return `/product-list/${routePath || 'all'}`;
  }


/* 商品操作按鈕 */

// 安全檢查目前商品是否已被收藏
  checkIfProductIsCollected(): void {
    this.apiTestService.getUserCollect().subscribe({
      next: (res: CollectRes) => {
        if (res.statusCode === 200 && res.collectListVo) {
          const matched = res.collectListVo.find(item =>
           (item as any).productId === this.product?.productId
          );

          if (matched) {
            this.isCollected = true;
            this.currentCollectId = matched.collectId; // 記下身分證字號
          }
        }
      }
    });
  }

//加入收藏
  toggleCollect(): void {
    if (!this.product) return;
    if (!this.ensureLogin('收藏失敗！', '您需要先登入，才能收藏商品喔！')) return;
    if(!this.ifMyStore('無法收藏喔！','這是您自己上架的商品，不需要再收藏自己啦！')) return;

   if (!this.isCollected) {
    this.apiTestService.addCollect(this.product.productId).subscribe({
      next:(res)=>{
        if(res.statusCode === 200){
        this.isCollected = true;

        //關鍵補防：加入成功後立刻重撈，把資料庫新產生的 collectId 抓回來備用
            this.apiTestService.getUserCollect().subscribe({
              next: (collectRes) => {
                const matched = collectRes.collectListVo?.find(item =>
                  (item as any).productId === this.product?.productId
                );
                if (matched) this.currentCollectId = matched.collectId;
              }
            });

        Swal.fire({
        title: '已加入收藏！',
        text: `商品「${this.product!.productName}」已成功收藏。`,
        icon: 'success',
        confirmButtonText: '好的',
        confirmButtonColor: '#EDA900'
        });
      }else{
        Swal.fire({ icon: 'error', title: '收藏失敗', text: res.message });
      }
    }
  });

  }else{
    const collectId = this.currentCollectId;
    if (collectId === null) {
        console.warn('找不到收藏 ID，無法刪除');
        return;
      }
    this.apiTestService.deleteCollect([collectId]).subscribe({
      next:(res)=>{
        if(res.statusCode=== 200){
          this.isCollected = false;
          this.currentCollectId = null; // 清空小抽屜

          Swal.fire({
              title: '已取消收藏',
              text: `已將「${this.product!.productName}」移出收藏清單。`,
              icon: 'info',
              confirmButtonText: '好的',
              confirmButtonColor: '#EDA900'
            });
        } else {
          Swal.fire({ icon: 'error', title: '取消收藏失敗', text: res.message });
        }
      }
    });
  }
  }

  // 發送請求按鈕
  sendRequest(): void {
    if (!this.product) return;
    if (!this.ensureLogin('無法發送購買請求！', '請先登入，才能向同學發送購買請求喔！')) return;
// 防呆：如果已經發送過了，就不讓使用者再點擊
    if (this.isRequested) return;
    if(!this.ifMyStore('無法發送請求喔！','這是妳自己上架的商品，沒辦法對自己發送請求喔！')) return;
    Swal.fire({
      title: '確定要發送購買請求嗎？',
      text: `系統將會發送「${this.product.productName}」的購買意願給賣家。`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '確定發送',
      cancelButtonText: '我在想想',
      confirmButtonColor: '#EDA900',
      cancelButtonColor: '#999999',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {

        const orderPayLoad: OrderVo = {
          productId: this.product!.productId
        };

        this.apiTestService.addOrder(orderPayLoad).subscribe({
          next: (res) => {
            if(res.statusCode === 200){
               this.isRequested = true; // 狀態改為已發送
                Swal.fire({
                  title: '發送成功！',
                  text: '已成功向賣家發送購買請求，請靜待同學的回覆！',
                  icon: 'success',
                  confirmButtonText: '好的',
                  confirmButtonColor: '#EDA900'
                });
            }else{
              Swal.fire({
                title: '發送失敗',
                text: res.message, // 顯示後端吐回來的錯誤原因
                icon: 'warning',
                confirmButtonText: '知道了',
                confirmButtonColor: '#EDA900'
              });
            }
          },
          error:(err)=>{
            console.error('發送購買請求失敗：', err);
            Swal.fire({
              title: '連線失敗',
              text: '系統無法載入訂單資訊，請稍後再試',
              icon: 'error',
              confirmButtonText: '好的',
              confirmButtonColor: '#999999'
            });
          }
        });

      }
    });
  }

  // 在底下加入三個點控制的方法
toggleMenu(event: Event): void {
  event.stopPropagation();
  this.isMenuOpen = !this.isMenuOpen;
}

// 分享商品功能
shareProduct(): void {
  if (!this.product) return;

  // 抓取目前網頁的完整網址，直接塞進使用者的剪貼簿
  navigator.clipboard.writeText(window.location.href).then(() => {
    this.isMenuOpen = false; // 複製完順手關閉選單
    Swal.fire({
      title: '連結已複製！',
      text: '快去分享給學校同學吧！',
      icon: 'success',
      confirmButtonText: '好的',
      confirmButtonColor: '#EDA900'
    });
  });
}

// 點擊選單內的檢舉
onReportClick(): void {
  this.isMenuOpen = false; // 關閉選單
  if (!this.ensureLogin('請先登入！', '您需要登入後才能使用檢舉功能喔！')) return;
  if(!this.ifMyStore('操作失敗！','這是您自己上架的商品，不能檢舉自己喔！')) return;
  this.reportProduct();    // 呼叫檢舉功能
}

// 當使用者點選網頁其他任何地方時，自動把選單收起來
@HostListener('document:click')
closeMenu(): void {
   this.isMenuOpen = false;
}

  /*檢舉商品的功能*/
  reportProduct() {
    if (!this.product) return;
    this.reportService.openReportDialog(
      'product',
      this.product.productName,
      this.product.userId.toString(),
      this.product.productId.toString()
    );
  }



   // --- 賣家操作 ---
  openChat(): void {
    if (!this.product) return;
    if (!this.ensureLogin('請先登入！', '您需要登入後才能使用聊天功能喔！')) return;
    if(!this.ifMyStore('不能跟自己聊天喔！','這是您自己上架的商品，沒辦法跟自己開啟聊天室喔！')) return;
    const targetUserId = this.product.seller?.userId || this.product.userId;
    this.router.navigate(['/chat',targetUserId]);
  }

  gotoStore(): void {
    if (!this.product) return;
    this.router.navigate(['/store', this.product.userId]);
  }

/**共用方法: 未登入 */
  ensureLogin(title: string, text: string): boolean {
    const currentUser = this.userService.currentUser();
    if (!currentUser) {
      Swal.fire({
        title: title,
        text: text,
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
      return false;
    }
    return true;
  }

  /**共用方法: 是自己的商品 */
  ifMyStore(title: string, text: string): boolean{
      if (this.isOwnProduct) {
      Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        confirmButtonText: '知道了',
        confirmButtonColor: '#EDA900'
      });
      return false;
    }
    return true;
  }

 }
