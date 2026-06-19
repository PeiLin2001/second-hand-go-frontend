import { Component, HostListener } from '@angular/core';

import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  Home
} from 'lucide-angular';
import { UiBehaviorService } from '../../@Services/ui-behavior.service';

@Component({
  selector: 'app-seller',
  imports: [LucideAngularModule],
  templateUrl: './seller.component.html',
  styleUrl: './seller.component.scss',
  providers: [
      {
        provide: LUCIDE_ICONS,
        useValue: new LucideIconProvider({ Home }),
      },
  ]
})
export class SellerComponent {
  constructor(
    protected uiBehavior: UiBehaviorService,
  ) {}

  // =========================================================
  // PANEL OPEN / CLOSE
  // =========================================================

  panelState = {
    sort:     false,
    filter:   false,
  };

  togglePanel(event: Event, panel: keyof typeof this.panelState) {
    this.uiBehavior.togglePanel(event, this.panelState, panel);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.uiBehavior.closeAll(this.panelState);
  }

  // =========================================================
  // SORT
  // =========================================================

  sortOption: 'newest' | 'credit-score'  | 'transaction-count' = 'newest';

  setSort(option: typeof this.sortOption, event: Event): void {
    event.stopPropagation();
    this.sortOption = option;
    this.panelState.sort = false;
    // this.pagination.goToPage(1);
  }

  get sortLabel(): string {
    const map = {
      'newest':     '最新加入',
      'credit-score':     '信用評分',
      'transaction-count': '交易筆數'
    };
    return map[this.sortOption];
  }

  // get sortedProducts(): ProductCard[] {
  //   const list = [...this.filteredProducts];
  //   switch (this.sortOption) {
  //     case 'price-asc':  return list.sort((a, b) => a.price - b.price);
  //     case 'price-desc': return list.sort((a, b) => b.price - a.price);
  //     case 'newest':
  //     default:           return list; // 假設原始資料已是最新排序
  //   }
  // }

}
