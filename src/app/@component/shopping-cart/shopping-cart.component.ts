import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // 1. Import FormsModule


import { LucideAngularModule, MessageCircleMore, Trash2, HeartIcon, MapPin, GraduationCap } from 'lucide-angular';
import Swal from 'sweetalert2';
import { ApiTestService } from '../../@Services/api-test.service';
import { Router, RouterLink } from '@angular/router';
import { ProductVo } from '../../@Interface/product-vo';


@Component({
  selector: 'app-shopping-cart',
  imports: [LucideAngularModule, FormsModule, RouterLink],
  templateUrl: './shopping-cart.component.html',
  styleUrl: './shopping-cart.component.scss'
})
export class ShoppingCartComponent {

  // =========================================================
  // ICON
  // =========================================================


  readonly Trash2Icon = Trash2;
  readonly MapPinIcon = MapPin;
  readonly HeartIcon = HeartIcon;
  readonly MessageCircleIcon = MessageCircleMore;
  readonly GraduationCapIcon = GraduationCap;


  // =========================================================
  // PURCHASE QUANTITY
  // =========================================================

  productAmount = 0;
  alert = "";
  products: any[] = [];
  expandedDescriptions = new Set<number>();
  constructor(private router: Router, private apiTestService: ApiTestService) { }

  ngOnInit(): void {
    this.loadUserFavorites(); // 網頁一打開，立刻載入後端收藏清單
  }

  // 載入後端收藏清單功能
  loadUserFavorites(): void {
    this.apiTestService.getUserCollect().subscribe({
      next: (res) => {
        if (res.statusCode === 200 && res.collectListVo) {
          this.products = res.collectListVo.map(item => ({
            collectId: item.collectId,
            productId: item.productId,
            sellerId: item.sellerId,
            title: item.productName,
            price: item.price,
            location: item.location && item.location.length > 0
              ? item.location.join('、')
              : '未提供地點',
            imgUrl: item.imgPath || 'assets/bag.jpg',
            sellerName: item.sellerName,
            sellerImg: item.sellerImg || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR54AYQT76piHk4cPNEzhiwKO9cqRr0nk2JSg&s',
            selected: false,                 // 複選框專用狀態，預設不勾選
            condition: item.condition || '狀況未知',
            description: item.decription || '同學很懶，這個商品沒有寫下任何描述。不過既然點了收藏，就趕快按右邊對話框跟同學聊聊確認吧！',
            university: item.school || '未知學校'
          }));

          this.productAmount = this.products.length; // 更新總收藏數量
        }
      },
      error: (err) => {
        console.error('載入收藏清單失敗：', err);
      }
    });
  }


  toggleDescription(productId: number) {
    if (this.expandedDescriptions.has(productId)) {
      this.expandedDescriptions.delete(productId);
    } else {
      this.expandedDescriptions.add(productId);
    }
  }


  isDescriptionExpanded(productId: number): boolean {
    return this.expandedDescriptions.has(productId);
  }



  deleteList() {
    const selectedItems = this.products.filter(p => p.selected);

    if (selectedItems.length > 0) {
      this.alert = ""; // 清空警告訊息

      Swal.fire({
        title: `確定要刪除這 ${selectedItems.length} 筆商品嗎？`,
        text: "移除後如果想再加入，需要回到商品詳細頁重新點擊愛心喔！",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EDA900", // 對齊妳們的暖黃主題色
        cancelButtonColor: "#d33",
        confirmButtonText: "確定刪除",
        cancelButtonText: "取消"
      }).then((result) => {
        if (result.isConfirmed) {

          // 2. 提取所有被勾選商品的後端 collectId，做成陣列 [1, 2, 3...]
          const idsToDelete = selectedItems.map(item => item.collectId);

          // 3. 呼叫我們剛剛跟後端大復活的「掛肉粽」批量刪除 API
          this.apiTestService.deleteCollect(idsToDelete).subscribe({
            next: (res) => {
              if (res.statusCode === 200) {
                Swal.fire({
                  title: `已刪除 ${selectedItems.length} 筆商品！`,
                  icon: "success",
                  confirmButtonColor: "#EDA900"
                });

                // 4. 刪除成功後，重新呼叫加載，網頁卡片就會啪一聲瞬間消失，超級流暢！
                this.loadUserFavorites();
              } else {
                Swal.fire('刪除失敗', res.message, 'error');
              }
            },
            error: (err) => {
              console.error('批量刪除失敗：', err);
              Swal.fire('連線失敗', '後端水管似乎斷了，請稍後再試', 'error');
            }
          });
        }
      });

    } else {
      // 5. 如果使用者什麼都沒勾就按刪除，亮起妳設計的經典提示
      this.alert = "請選擇您要刪除的商品！";
    }
  }

  openChat(sellerId: number): void {
    if (!sellerId) {
      Swal.fire({
        title: '無法開啟聊天',
        text: '暫時找不到該同學的資訊',
        icon: 'warning',
        confirmButtonColor: '#EDA900'
      });
      return;
    }
    this.router.navigate(['/chat', sellerId], { queryParams: { productId: this.products[0].productId } });
  }

}
