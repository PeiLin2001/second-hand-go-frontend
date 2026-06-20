import { EduApiGovService } from './../../@Services/edu-api-gov.service';
import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

import {
  LucideAngularModule,
  Home,
  Box,
  List,
  CirclePile,
  School,
  MapPin,
  MoonStar,
  SmilePlus,
  CircleQuestionMark
} from 'lucide-angular';

import { FormsModule } from '@angular/forms';
import { UiBehaviorService } from '../../@Services/ui-behavior.service';
import { EighteenAcademyService } from '../../@Services/eighteen-academy.service';
import { CategoriesService } from '../../@Services/categories.service';

@Component({
  selector: 'app-side-nav',
  imports: [LucideAngularModule, FormsModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss'
})
export class SideNavComponent {

  constructor(
    private router: Router,
    private uiBehavior: UiBehaviorService,
    private eac:EighteenAcademyService,
    private category:CategoriesService,
    private eduApiGovService: EduApiGovService
  ){}

  // Declare icon
  readonly HomeIcon = Home;
  readonly BoxIcon = Box;
  readonly ListIcon = List;
  readonly CirclePileIcon = CirclePile;
  readonly SmilePlusIcon = SmilePlus;
  readonly SchoolIcon = School;
  readonly MapPinIcon = MapPin;
  readonly MoonStarIcon = MoonStar;
  readonly CircleQuestionMarkIcon = CircleQuestionMark;

  // 常見分類
  // 宣告商品種類
  get categories():any[]{
    return this.category.categories
  }

  // 被選擇的商品種類
  selectedCategory = '';
  selectedDepts: string[] = [];

  // 以常見分類選擇商品
  selectCategory(value: string){
    this.selectedCategory = value;
    this.goToProductList();
  }

  // 以學群選擇商品
  toggleDept(name: string): void {
    const idx = this.selectedDepts.indexOf(name);
    if (idx > -1) { // indexOf() 方法會回傳給定元素於陣列中第一個被找到之索引，若不存在於陣列中則回傳 -1。
      this.selectedDepts.splice(idx, 1);
    } else {
      this.selectedDepts.push(name);
    }
  }

  confirmDepts(): void {
    if (this.selectedDepts.length === 0) {
      return;
  }

    this.router.navigate(['/product-list', 'all'], {
      queryParams: this.selectedDepts.length > 0
        ? { depts: this.selectedDepts.join(',') }
        : {}
    });
  }

  // 進入校板
  schools: any[] = [];
  searchText: string = '';

  ngOnInit(): void {
    this.eduApiGovService.getSchools().subscribe({
      next: (data) => {
        // this.schools = Array.from(
        //   new Map(
        //     data.map(item => [
        //       item['代碼'],
        //       item
        //     ])
        //   ).values()
        // );

        // console.log('去重後', this.schools.length);

        const latestYear = Math.max(
          ...data.map(x => Number(x['學年度']))
        );

        this.schools = data.filter(
          x => Number(x['學年度']) === latestYear
        );

      },
      error: (err) => {
        console.error('無法載入學校資料：', err);
      }
    });
  }

// 過濾後的學校清單
get filteredSchools(): any[] {
  const keyword = this.searchText.trim();
  if (!keyword) return this.schools;
  return this.schools.filter(s =>
    s['學校名稱']?.includes(keyword)
  );
}

// 選擇學校後直接導航
selectSchool(school: any): void {
  this.router.navigate(['/school-community', Number(school['代碼'])]);
  this.panelState.school = false;
  this.searchText = '';
}


  goToHome(){
    this.router.navigate(['/home']);
    window.scrollTo({top: 0,
      left: 0,
      behavior: "smooth"});
  }

  goToWish(){
    this.router.navigate(['/wish']);
  }

  goToSeller(){
    this.router.navigate(['/seller']);
  }

  // =========================================================
  // PANEL OPEN / CLOSE
  // =========================================================

  panelState = {
    academic: false,
    category: false,
    school: false
  };

  togglePanel(event: Event, panel: keyof typeof this.panelState) {
    this.uiBehavior.togglePanel(event, this.panelState, panel);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.uiBehavior.closeAll(this.panelState);
  }


  goToManual() {
    // 檢查目前是否已在 home
    if (this.router.url.includes('/home')) {
      const element = document.getElementById('manual');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      this.router.navigate(['/home'], { fragment: 'manual' });
    }
  }

  // Navigate to product-list
  goToProductList(){
    this.router.navigate(['/product-list', this.selectedCategory]);
  }

  schoolId = 1;

  // goToSchoolForum() {
  //   // let id = this.userService.currentUser().userId;
  //   if (this.schoolId) { this.router.navigate(['/school-community', Number(this.schoolId)]); }
  //   this.panelState.school = false;
  // }

  get academics(): any[]{
    return this.eac.academy
  }
}
