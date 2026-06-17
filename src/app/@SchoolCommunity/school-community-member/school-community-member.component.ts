import { UserService } from './../../@Services/user.service';
import { Component } from '@angular/core';
import { User } from '../../@Interface/user';
import { ActivatedRoute } from '@angular/router';
import { EduApiGovService } from '../../@Services/edu-api-gov.service';

import {
  LucideAngularModule
} from 'lucide-angular';

import { ReportService } from '../../@Services/report.service';
import { UserCardComponent } from "../../@component/user-card/user-card.component";
import { FormsModule } from "@angular/forms";

// 引入需要的 RxJS 操作符
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-school-community-member',
  imports: [LucideAngularModule, UserCardComponent, FormsModule],
  templateUrl: './school-community-member.component.html',
  styleUrl: './school-community-member.component.scss'
})
export class SchoolCommunityMemberComponent {
  classmate: User[] = [];
  filteredClassmate: User[] = [];
  searchText = '';

  // 建立一個 RxJS Subject 來接收輸入框的改變
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;


  constructor(
    private route: ActivatedRoute,
    private eduApiGovService: EduApiGovService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // get the data resource by parent route
    const schoolId = Number(
      this.route.parent?.snapshot.paramMap.get('id')
    );

    // get the school data by id
    this.eduApiGovService.getSchools().subscribe(data => {

      // Datas of the target school
      const school = data.find(
        s => Number(s['代碼']) === schoolId
      );

      if (!school) return;

      const schoolName = school['學校名稱'];

      // find the members in the target school
      this.userService
        .getUserDataBySchool(schoolName)
        .subscribe(res => {
          this.classmate = res.user ?? [];
          this.filteredClassmate = this.classmate.sort((a, b) => b.goodLevel - a.goodLevel); // 剛進入頁面時，預設顯示所有人
        });
    });

    // 2. 設定防抖搜尋邏輯 (核心升級！)
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),         // 等待使用者停止輸入 300 毫秒後才往下走
      distinctUntilChanged()     // 如果內容跟上一次一樣（例如按了 Ctrl 或 Shift 鍵），就不重複執行
    ).subscribe(keyword => {
      this.performSearch(keyword);
    });
  }


  // 當使用者在 input 輸入時，呼叫這個方法
  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  // 實際執行過濾的邏輯
  private performSearch(keyword: string): void {
    const cleanKeyword = keyword.trim().toLowerCase();

    if (!cleanKeyword) {
      this.filteredClassmate = this.classmate;
      return;
    }

    this.filteredClassmate = this.classmate.filter(c => {
      const nameMatch = c.userName?.toLowerCase().includes(cleanKeyword);
      const deptMatch = c.department?.toLowerCase().includes(cleanKeyword);
      return nameMatch || deptMatch;
    });
  }

  // 良好的習慣：銷毀元件時解訂閱，防止記憶體洩漏
  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }


  clearAllFilters(event: Event): void {
    event.stopPropagation();
    this.searchText ='';
    this.filteredClassmate = this.classmate;
  }

}
