import { Component, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Wish } from '../../@Services/wish-service.service';

import {
  LUCIDE_ICONS,
  LucideAngularModule, LucideIconProvider, MessageCircleMore,MoreVertical, Flag, Copy
} from 'lucide-angular';
import Swal from 'sweetalert2';
import { ReportService } from '../../@Services/report.service';

@Component({
  selector: 'app-wish-card',
  imports: [LucideAngularModule],
  templateUrl: './wish-card.component.html',
  styleUrl: './wish-card.component.scss',
  providers: [
      {
        provide: LUCIDE_ICONS,
        useValue: new LucideIconProvider({
         MessageCircleMore,
         MoreVertical,
         Flag,
         Copy
        })
      }
    ]
})
export class WishCardComponent {

  openMenuWishId: number | null = null;

  constructor(
    private router: Router,
    private reportService: ReportService
    ){}

  ngOnInit(): void {
  }

  // 接收外部傳入的商品列表（必填）
  @Input() wishList: Wish[] = [];

  chat() { this.router.navigate(['/chat']); }


  // 三個點點
  isMenuOpen = false;

  toggleMenu(event: Event, item: any): void {
    event.stopPropagation();
    // 先把「其他」所有項目的選單都關掉（確保一次只會打開一個）
    this.openMenuWishId = this.openMenuWishId === item.id ? null : item.id;
  }

  // 分享連結
  shareProduct(item: Wish): void {
    // 抓取目前網址
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.isMenuOpen = false;

      Swal.fire({
        title: '連結已複製！',
        icon: 'success',
        confirmButtonText: '確定',
        confirmButtonColor: '#EDA900'
      });
    });
  }


  // 檢舉
  // 將特定的 item (Wish 物件) 當作參數傳進方法裡
  goRepot(item: Wish) {
    if (!item || !item.wisher) return;
    this.isMenuOpen = false;
    // 檢舉用戶
    // 記得把 userId 轉成字串 (.toString())，因為 ReportService 只收 string
    this.reportService.openReportDialog(
      'user',
      item.wisher.userName,
      item.wisher.userId.toString()
    );
  }

  @HostListener('document:click')
  closeAll(): void{
    this.openMenuWishId = null;
  }
}
