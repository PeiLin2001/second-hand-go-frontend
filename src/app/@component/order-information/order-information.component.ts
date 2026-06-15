import { ApiTestService } from './../../@Services/api-test.service';
import { UserService } from './../../@Services/user.service';
import { Component, effect } from '@angular/core';
import {
  LucideAngularModule, LUCIDE_ICONS, LucideIconProvider,
  CircleCheckBig, MessageCircleMore, CircleX, CircleEllipsis,
  CircleDollarSign, ChevronRight, ChevronLeft,
} from 'lucide-angular';
import Swal from 'sweetalert2';
import { PaginationService } from '../../@Services/pageination.service';
import { Router } from '@angular/router';
import { ReportService } from '../../@Services/report.service';

@Component({
  selector: 'app-order-information',
  imports: [LucideAngularModule],
  templateUrl: './order-information.component.html',
  styleUrl: './order-information.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({
        CircleCheckBig, MessageCircleMore, CircleX, CircleEllipsis,
        CircleDollarSign, ChevronRight, ChevronLeft,
      })
    }
  ]
})
export class OrderInformationComponent {
  constructor(
    public pagination: PaginationService,
    private router: Router,
    private reportService: ReportService,
    private userService: UserService,
    private apiTestService: ApiTestService,
  ) {
    effect(() => {
      const user = this.userService.currentUser();
      if (user) {
        this.currentUserName = user.userName;
        this.fetchOrder();
      }
    });
  }
  //tabs
  currentTab = '全部訂單'; // 預設選中
  // 列表欄位
  tabsColumns: string[] = ['全部訂單', '交易中', '已完成', '已取消', '交易請求中',];

  // role 切換
  currentRole: string = '全部'; // 預設
  roleColumns: string[] = ['全部', '我購買的', '我販售的'];
  currentUserName: string = ''; // 使用者名稱


  // tab 對應 status
  statusMap: Record<string, string> = {
    全部訂單: '',
    交易中: '交易中',
    已完成: '完成交易',
    已取消: '已取消',
    交易請求中: '請求回應中',
  };

  pageSize = 5; // 分頁變數
  allOrders: any[] = [];

  // 獲得訂單資料
  fetchOrder() {
    this.apiTestService.getAllOrder().subscribe({
      next: (res) => {
        let rawOrders = res.orderList;
        this.allOrders = rawOrders.map((order: any) => { // 強行對齊(╬▔皿▔)
          let myRole = order.buyerName === this.currentUserName ? '買家' : '賣家';
          return {
            ...order, // 保留原本的所有欄位
            status: order.status === '訂單成立' ? '交易中' : order.status,
            myRole,
            partnerRole: myRole === '買家' ? '賣家' : '買家',
            partnerName: myRole === '買家' ? order.sellerName : order.buyerName,
            partnerId: myRole === '買家' ? order.sellerId : order.buyerId,
            givenRank: myRole === '買家' ? order.salesmanRank : order.buyerRank, // 給予交易對象的評分
            myRank: myRole === '買家' ? order.buyerRank : order.salesmanRank, // 交易對象給使用者的評分
          }
        });
        this.updatePaginationTotal(); // 初始化分頁器

      },
      error: (err) => {
        console.error('抓取訂單失敗', err);
      }
    });
  }

  // 更新分頁總數
  private updatePaginationTotal() {
    // 1. 取得當前篩選條件下的所有資料總筆數
    const filteredTotal = this.allOrders.filter((order) => {
      let roleMatch =
        this.currentRole === '全部'
          ? true
          : this.currentRole === '我購買的'
            ? order.myRole === '買家'
            : order.myRole === '賣家';
      let statusMatch =
        this.statusMap[this.currentTab] === ''
          ? true
          : order.status === this.statusMap[this.currentTab];
      return roleMatch && statusMatch;
    }).length;

    // 2. 初始化分頁（這會自動產生對應的 pageNumbers 陣列）
    this.pagination.init(filteredTotal, this.pageSize);
  }

  changeTab(tabName: string) {
    this.currentTab = tabName;
    this.changeRole('全部'); // 重新篩選販售/購買
    this.updatePaginationTotal(); // 重新計算總頁數
    this.pagination.goToPage(1); // 回第一頁
  }

  changeRole(role: string) {
    this.currentRole = role;
    this.updatePaginationTotal(); // 重新計算總頁數
    this.pagination.goToPage(1); // 回第一頁
  }

  chat(order: any) {
    if (!order) return;
    this.router.navigate(['/chat', order.partnerId]);
  }

  // 分頁
  prevPage() { this.pagination.prevPage(); }
  nextPage() { this.pagination.nextPage(); }
  goToPage(page: number) { this.pagination.goToPage(page); }

  filteredOrders() {
    let filtered = this.allOrders.filter((order) => {
      // role 篩選
      let roleMatch =
        this.currentRole === '全部' ? true
          : this.currentRole === '我購買的'
            ? order.myRole === '買家'
            : order.myRole === '賣家';

      // tab 篩選
      let statusMatch =
        this.statusMap[this.currentTab] === '' ? true
          : order.status === this.statusMap[this.currentTab];

      return roleMatch && statusMatch;
    });

    let start = (this.pagination.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  // 確認完成交易
  confirmComplete(order: any) {
    Swal.fire({
      title: '確認完成交易？',
      text: '確認後將無法撤回！',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '確認完成',
      cancelButtonText: '再想想',
    }).then((result) => {
      if (result.isConfirmed) {
        let changeOrderStatusVo = {
          orderId: order.orderId,
          email: this.userService.currentUser()?.userEmail
        };
        this.apiTestService.checkDelivery(changeOrderStatusVo).subscribe({
          next: (res) => {
            Swal.fire({
              title: '已送出確認！',
              text: '等待雙方皆確認後，系統將自動完成交易。',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
            });
            this.fetchOrder();
          },
          error: (err) => {
            console.error('送出確認失敗', err);
            Swal.fire('錯誤', '送出確認失敗，請稍後再試！', 'error');
          }
        })
      }
    });
  }

  // 進行評分
  submitReview(order: any) {
    Swal.fire({
      title: '為這次交易評分',
      html: `
      <p>${order.partnerRole}：${order.partnerName}</p>
      <input id="swal-score" type="number" min="1" max="5"
        class="swal2-input" placeholder="請輸入 1-5 分"
        style="width: 50%; font-size: 16px;">`,
      confirmButtonText: '送出評價',
      cancelButtonText: '取消',
      showCancelButton: true,
      preConfirm: () => {
        let score = (document.getElementById('swal-score') as HTMLInputElement)
          .value;
        if (!score || Number(score) < 1 || Number(score) > 5) {
          Swal.showValidationMessage('請輸入 1 到 5 之間的分數！');
          return false;
        }
        return { score: Number(score) };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        let changeOrderStatusVo = {
          orderId: order.orderId,
          level: result.value.score
        };
        this.apiTestService.giveLevel(changeOrderStatusVo).subscribe({
          next: (res) => {
            Swal.fire({
              title: '評價已送出！',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
            });
            this.fetchOrder();
          },
          error: (err) => {
            console.error('送出評價失敗', err);
            Swal.fire('錯誤', '送出評價失敗，請稍後再試！', 'error');
          }
        });
      }
    });
  }

  // 查看評價
  viewReview(order: any) {
    const score = order.givenRank;
    const stars = score > 0 ? '⭐'.repeat(score) : '尚未評價';
    Swal.fire({
      title: '我給對方的評價',
      html: `
      <p>${order.partnerRole}：${order.partnerName}</p>
      <p>評分：<span style="color: #ffcc00;">${stars}</span> ${score > 0 ? '(' + score + ' 分)' : ''} </p>`,
      confirmButtonText: '關閉',
    });
  }

  // 檢舉
  goRepot(order: any) {
    // 檢舉用戶
    this.reportService.openReportDialog('user', order.partnerName, order.partnerId);
  }

  // 交易對象賣場頁
  goStore(order: any) {
    this.router.navigate(['/store', order.partnerId]);
  }

  // 賣家同意請求
  acceptOrder(order: any) {
    Swal.fire({
      title: '確認同意該筆交易？',
      text: '確認後同一商品的其它訂單將自動取消！',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '確認同意',
      cancelButtonText: '再想想',
    }).then((result) => {
      if (result.isConfirmed) {
        let changeOrderStatusVo = {
          orderId: order.orderId,
          email: this.userService.currentUser()?.userEmail
        };
        this.apiTestService.acceptOrder(changeOrderStatusVo).subscribe({
          next: (res) => {
            Swal.fire({
              title: '已同意該筆請求！',
              text: '同一商品的其它訂單將自動取消！',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
            });
            this.fetchOrder();
          },
          error: (err) => {
            console.error('同意訂單失敗', err);
            Swal.fire('錯誤', '同意訂單失敗，請稍後再試！', 'error');
          }
        })
      }
    });
  }

  // 買家主動取消訂單
  canaelOrder(order: any) {
    Swal.fire({
      title: '確認取消該筆交易？',
      text: '確認後將無法撤回！',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '確認取消',
      cancelButtonText: '再想想',
    }).then((result) => {
      if (result.isConfirmed) {
        let changeOrderStatusVo = {
          orderId: order.orderId,
          email: this.userService.currentUser()?.userEmail
        };
        this.apiTestService.canaelOrder(changeOrderStatusVo).subscribe({
          next: (res) => {
            Swal.fire({
              title: '已取消！',
              text: '已取消該筆訂單請求！',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
            });
            this.fetchOrder();
          },
          error: (err) => {
            console.error('取消訂單失敗', err);
            Swal.fire('錯誤', '取消訂單失敗，請稍後再試！', 'error');
          }
        })
      }
    });
  }
}
