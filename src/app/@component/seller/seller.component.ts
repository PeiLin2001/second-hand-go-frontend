import { UserService } from './../../@Services/user.service';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  Home,
} from 'lucide-angular';

import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { UiBehaviorService } from '../../@Services/ui-behavior.service';
import { GPSLocationService } from '../../@Services/gps-location.service';

import { User } from '../../@Interface/user';
import { UserCardComponent } from '../user-card/user-card.component';

type SortOption = 'newest' | 'credit-score' | 'same-location' | 'recommended';

@Component({
  selector: 'app-seller',
  imports: [FormsModule, LucideAngularModule, UserCardComponent, RouterLink],
  templateUrl: './seller.component.html',
  styleUrl: './seller.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({ Home }),
    },
  ],
})
export class SellerComponent implements OnInit, OnDestroy {
  constructor(
    protected uiBehavior: UiBehaviorService,
    private gpsApi: GPSLocationService,
    private userService: UserService,
  ) {}

  // =========================================================
  // 資料狀態
  // =========================================================

  users: User[] = [];
  filteredUsers: User[] = [];

  searchText = '';

  sortOption: SortOption | null = null;

  showNearbyOnly = false;
  showGoodSellerOnly = false;

  cityName = '尚未定位';
  lat = 0;
  lng = 0;

  private readonly GOOD_SELLER_MIN_LEVEL = 4;

  // =========================================================
  // UI 狀態
  // =========================================================

  panelState = {
    sort: false,
    filter: false,
  };

  // =========================================================
  // 搜尋監聽
  // =========================================================

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // =========================================================
  // 生命週期
  // =========================================================

  ngOnInit(): void {
    this.loadUsers();
    this.getCurrentPosition();
    this.initSearchListener();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  // =========================================================
  // 取得賣家資料
  // =========================================================

  loadUsers(): void {
    this.userService.getAllUser().subscribe({
      next: (res) => {
        this.users = res.user;
        this.applyFilters();
      },
      error: (err) => {
        console.log(err.statusCode, err.message);
      },
    });
  }

  // =========================================================
  // 搜尋功能
  // =========================================================

  private initSearchListener(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((keyword) => this.applyFilters(keyword));
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  // =========================================================
  // 篩選功能
  // =========================================================

  get isValidCurrentCity(): boolean {
    return this.isValidCityName(this.cityName);
  }

  toggleNearbyFilter(event: Event): void {
    event.stopPropagation();

    if (!this.isValidCurrentCity) {
      return;
    }

    this.showNearbyOnly = !this.showNearbyOnly;
    this.applyFilters();
  }

  toggleGoodSellerFilter(event: Event): void {
    event.stopPropagation();

    this.showGoodSellerOnly = !this.showGoodSellerOnly;
    this.applyFilters();
  }

  clearAllFilters(event: Event): void {
    event.stopPropagation();

    this.searchText = '';
    this.showNearbyOnly = false;
    this.showGoodSellerOnly = false;
    this.sortOption = null;

    this.applyFilters();
  }

  private applyFilters(keyword: string = this.searchText): void {
    const cleanKeyword = keyword.trim().toLowerCase();

    let list = [...this.users];

    if (cleanKeyword) {
      list = list.filter((user) => {
        const nameMatch = user.userName?.toLowerCase().includes(cleanKeyword);
        const idMatch = user.userId?.toString().includes(cleanKeyword);
        const deptMatch = user.department?.toLowerCase().includes(cleanKeyword);

        return nameMatch || idMatch || deptMatch;
      });
    }

    if (this.showNearbyOnly) {
      list = list.filter((user) => this.isSameCity(user));
    }

    if (this.showGoodSellerOnly) {
      list = list.filter((user) => this.isGoodSeller(user));
    }

    this.filteredUsers = list;
  }

  private isGoodSeller(user: User): boolean {
    const goodLevel = Number(user.goodLevel ?? 0);

    return goodLevel >= this.GOOD_SELLER_MIN_LEVEL;
  }

  private isSameCity(user: User): boolean {
    if (!this.isValidCityName(this.cityName) || !user.location) {
      return false;
    }

    if (Array.isArray(user.location)) {
      return user.location.includes(this.cityName);
    }

    return String(user.location).includes(this.cityName);
  }

  private isValidCityName(cityName: string): boolean {
    return (
      !!cityName &&
      cityName !== '尚未定位' &&
      cityName !== '定位失敗' &&
      cityName !== '裝置不支援定位'
    );
  }

  // =========================================================
  // 排序功能
  // =========================================================

  setSort(option: SortOption, event: Event): void {
    event.stopPropagation();

    this.sortOption = option;
    this.panelState.sort = false;
  }

  get sortLabel(): string {
    if (!this.sortOption) {
      return '';
    }

    const map: Record<SortOption, string> = {
      newest: '最新加入',
      'credit-score': '信用評分最高',
      recommended: '綜合推薦',
      'same-location': '同地區優先',
    };

    return map[this.sortOption];
  }

  get sortedUsers(): User[] {
    const list = [...this.filteredUsers];

    if (!this.sortOption) {
      return list;
    }

    switch (this.sortOption) {
      case 'recommended':
        return list.sort((a, b) => {
          const locationCompare = this.compareSameLocation(a, b);

          if (locationCompare !== 0) {
            return locationCompare;
          }

          const scoreCompare = this.compareGoodLevel(a, b);

          if (scoreCompare !== 0) {
            return scoreCompare;
          }

          return this.compareNewest(a, b);
        });

      case 'same-location':
        return list.sort((a, b) => {
          const locationCompare = this.compareSameLocation(a, b);

          if (locationCompare !== 0) {
            return locationCompare;
          }

          return this.compareGoodLevel(a, b);
        });

      case 'credit-score':
        return list.sort((a, b) => {
          const scoreCompare = this.compareGoodLevel(a, b);

          if (scoreCompare !== 0) {
            return scoreCompare;
          }

          return this.compareNewest(a, b);
        });

      case 'newest':
        return list.sort((a, b) => this.compareNewest(a, b));
    }
  }

  private compareGoodLevel(a: User, b: User): number {
    const aScore = Number(a.goodLevel ?? 0);
    const bScore = Number(b.goodLevel ?? 0);

    return bScore - aScore;
  }

  private compareNewest(a: User, b: User): number {
    const aTime = this.getCreateTime(a);
    const bTime = this.getCreateTime(b);

    return bTime - aTime;
  }

  private compareSameLocation(a: User, b: User): number {
    const aSameCity = this.isSameCity(a) ? 1 : 0;
    const bSameCity = this.isSameCity(b) ? 1 : 0;

    return bSameCity - aSameCity;
  }

  private getCreateTime(user: User): number {
    const createDate = user.createDate;

    if (!createDate) {
      return 0;
    }

    const time = new Date(createDate).getTime();

    return Number.isNaN(time) ? 0 : time;
  }

  // =========================================================
  // 定位功能
  // =========================================================

  isGPSOpen = false;

  // gpsSwitch(event: Event) {
  //   this.isGPSOpen = !this.isGPSOpen;
  //   if (this.isGPSOpen) {
  //     this.cityName = '定位中...';
  //     this.getCurrentPosition();
  //   } else {
  //     this.cityName = '尚未定位';
  //     this.showNearbyOnly = false; // 如果關閉 GPS，通常也要取消「只看附近」的篩選
  //     this.applyFilters();
  //   }
  // }
  // isGPSOpen = false;

  gpsSwitch(event: Event): void {
    event.stopPropagation();

    if (this.isGPSOpen) {
      this.closeGPS();
      return;
    }

    this.openGPS();
  }

  private openGPS(): void {
    this.isGPSOpen = true;
    this.cityName = '定位中...';

    this.getCurrentPosition();
  }

  private closeGPS(): void {
    this.isGPSOpen = false;
    this.cityName = '尚未定位';
    this.lat = 0;
    this.lng = 0;

    this.showNearbyOnly = false;
    this.applyFilters();
  }

  getCurrentPosition(): void {
    if (!('geolocation' in navigator)) {
      this.cityName = '裝置不支援定位';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;

        this.calculateTheCity(this.lat, this.lng);
      },
      (error) => {
        console.error('定位失敗', error);

        this.cityName = '定位失敗';
        this.showNearbyOnly = false;
        this.applyFilters();
      },
    );
  }

  private calculateTheCity(lat: number, lng: number): void {
    this.gpsApi.getCityName(lat, lng).subscribe((city) => {
      this.cityName = city || '無法辨識城市';
      this.applyFilters();
    });
  }

  // getCurrentPosition(): void {
  //   if (this.isGPSOpen == false) {
  //     return;
  //   }

  //   if (!('geolocation' in navigator)) {
  //     this.cityName = '裝置不支援定位';
  //     return;
  //   }

  //   navigator.geolocation.getCurrentPosition(
  //     (position) => {
  //       this.lat = position.coords.latitude;
  //       this.lng = position.coords.longitude;

  //       this.calculateTheCity(this.lat, this.lng);
  //     },
  //     (error) => {
  //       console.error('定位失敗', error);
  //       this.cityName = '定位失敗';
  //     },
  //   );
  // }

  // private calculateTheCity(lat: number, lng: number): void {
  //   this.gpsApi.getCityName(lat, lng).subscribe((city) => {
  //     this.cityName = city;
  //     this.applyFilters();
  //   });
  // }

  // =========================================================
  // 面板控制
  // =========================================================

  togglePanel(event: Event, panel: keyof typeof this.panelState): void {
    this.uiBehavior.togglePanel(event, this.panelState, panel);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.uiBehavior.closeAll(this.panelState);
  }
}
