import { UserService } from './../../@Services/user.service';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

@Component({
  selector: 'app-seller',
  imports: [FormsModule, LucideAngularModule, UserCardComponent],
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
  // =========================================================
  // 建構子
  // =========================================================

  constructor(
    protected uiBehavior: UiBehaviorService,
    private gpsApi: GPSLocationService,
    private userService: UserService,
  ) {}

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
  // 主要資料：賣家列表
  // =========================================================

  users: User[] = [];
  filteredUsers: User[] = [];

  // =========================================================
  // 主要資料：取得賣家資料
  // =========================================================

  loadUsers() {
    this.userService.getAllUser().subscribe({
      next: (res) => {
        this.users = res.user;
        this.filteredUsers = this.users;
        console.log(res.user);
      },
      error: (err) => {
        console.log(err.statusCode, err.message);
      },
    });
  }

  // =========================================================
  // 搜尋
  // =========================================================

  searchText: string = '';

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  private initSearchListener(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((keyword) => {
        this.performSearch(keyword);
      });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  private performSearch(keyword: string): void {
    const cleanKeyword = keyword.trim().toLowerCase();

    if (!cleanKeyword) {
      this.filteredUsers = this.users;
      return;
    }

    this.filteredUsers = this.users.filter((user) => {
      const nameMatch = user.userName?.toLowerCase().includes(cleanKeyword);

      const deptMatch = user.department?.toLowerCase().includes(cleanKeyword);

      return nameMatch || deptMatch;
    });
  }

  // =========================================================
  // 排序功能
  // =========================================================

  sortOption: 'newest' | 'credit-score' | 'transaction-count' = 'newest';

  setSort(option: typeof this.sortOption, event: Event): void {
    event.stopPropagation();

    this.sortOption = option;
    this.panelState.sort = false;
  }

  get sortLabel(): string {
    const map = {
      newest: '最新加入',
      'credit-score': '信用評分',
      'transaction-count': '交易筆數',
    };

    return map[this.sortOption];
  }

  // =========================================================
  // 主要資料：目前位置
  // =========================================================

  cityName: string = '尚未定位';
  lat: number = 0;
  lng: number = 0;

  // =========================================================
  // 定位功能
  // =========================================================

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
      },
    );
  }

  private calculateTheCity(lat: number, lng: number): void {
    this.gpsApi.getCityName(lat, lng).subscribe((city) => {
      this.cityName = city;
      console.log('所在縣市：', city);
    });
  }

  // =========================================================
  // 清除篩選
  // =========================================================

  clearAllFilters(event: Event): void {
    event.stopPropagation();

    this.searchText = '';
    this.filteredUsers = this.users;
  }

  // =========================================================
  // UI 輔助：面板開關
  // =========================================================

  panelState = {
    sort: false,
    filter: false,
  };

  togglePanel(event: Event, panel: keyof typeof this.panelState): void {
    this.uiBehavior.togglePanel(event, this.panelState, panel);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.uiBehavior.closeAll(this.panelState);
  }
}
