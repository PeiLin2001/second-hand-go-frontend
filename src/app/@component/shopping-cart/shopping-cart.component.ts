import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common'


import { LucideAngularModule, MessageCircleMore, Trash2, HeartIcon, MapPin, GraduationCap } from 'lucide-angular';
import Swal from 'sweetalert2';
import { ApiTestService } from '../../@Services/api-test.service';
import { Router, RouterLink } from '@angular/router';
import { ProductVo } from '../../@Interface/product-vo';


@Component({
  selector: 'app-shopping-cart',
  imports: [LucideAngularModule, FormsModule, RouterLink, DecimalPipe],
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
    console.log(this.products);

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
            selected: false,
            condition: item.condition || '未填寫',
            description: item.decription || '此商品沒有描述',
            university: item.school || '未提供學校'
          }));

          this.productAmount = this.products.length;
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
      this.alert = "";

      Swal.fire({
        title: `確定要刪除這 ${selectedItems.length} 筆商品嗎？`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "確定刪除",
        cancelButtonText: "取消"
      }).then((result) => {
        if (result.isConfirmed) {

          const idsToDelete = selectedItems.map(item => item.collectId);
          this.apiTestService.deleteCollect(idsToDelete).subscribe({
            next: (res) => {
              if (res.statusCode === 200) {
                Swal.fire({
                  title: `已刪除 ${selectedItems.length} 筆商品！`,
                  icon: "success",
                  confirmButtonColor: "#EDA900"
                });

                this.loadUserFavorites();
              } else {
                Swal.fire('刪除失敗', res.message, 'error');
              }
            },
            error: (err) => {
              console.error('批量刪除失敗：', err);
              Swal.fire('連線失敗', '伺服器連線錯誤，請稍後再試', 'error');
            }
          });
        }
      });
    } else {
      this.alert = "請選擇您要刪除的商品！";
    }
  }

  openChat(sellerId: number): void {
    if (!sellerId) {
      Swal.fire({
        title: '無法開啟聊天',
        text: '暫時找不到該同學的資訊',
        icon: 'warning',
      });
      return;
    }
    this.router.navigate(['/chat', sellerId], { queryParams: { productId: this.products[0].productId } });
  }

}
