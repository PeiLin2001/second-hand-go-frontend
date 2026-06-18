import { WishServiceService, Wisher } from './../../@Services/wish-service.service';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EduApiGovService } from '../../@Services/edu-api-gov.service';
import { UserService } from '../../@Services/user.service';
import { Wish } from './../../@Services/wish-service.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  LUCIDE_ICONS,
  LucideAngularModule, LucideIconProvider, Plus, X
} from 'lucide-angular';
import { WishCardComponent } from "../../@component/wish-card/wish-card.component";
import { CategoriesService } from '../../@Services/categories.service';
import Swal from 'sweetalert2';

export interface WishForm {
  title: string;
  description: string;
  location: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  expiredAt: string;
}

/** 對應後端 WishReq */
interface WishReq {
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
}

@Component({
  selector: 'app-school-community-seeking',
  imports: [LucideAngularModule, WishCardComponent, FormsModule],
  templateUrl: './school-community-seeking.component.html',
  styleUrl: './school-community-seeking.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({ Plus, X })
    }
  ]
})
export class SchoolCommunitySeekingComponent {

  private readonly wishApiUrl = 'http://localhost:8080/wish';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private eduApiGovService: EduApiGovService,
    private userService: UserService,
    protected ctgService: CategoriesService,
    private wishServiceService: WishServiceService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log("userID:",  this.userService.currentUser()?.userId);

    const schoolId = Number(
      this.route.parent?.snapshot.paramMap.get('id')
    );

    this.eduApiGovService.getSchools().subscribe(data => {
      const school = data.find(s => Number(s['代碼']) === schoolId);
      if (!school) return;

      const schoolName = school['學校名稱'];
      this.wishServiceService.getWishesBySchool(schoolName)
        .subscribe(res => {
          this.wishList = res.wishesList;
        });
    });
  }

  // ── 資料 ──────────────────────────────────────────
  wishList: Wish[] = [];
  showPanel = false;
  isSubmitting = false;   // 防止重複送出
  submitError = '';       // 顯示錯誤訊息

  wishForm: WishForm = this.emptyForm();

  locationOptions = ['圖書館', '學生餐廳', '宿舍', '行政大樓', '體育館', '其他'];

  // ── 面板操作 ──────────────────────────────────────
  // openPanel(): void {
  //   this.wishForm = this.emptyForm();
  //   this.submitError = '';
  //   this.showPanel = true;
  // }

  closePanel(): void {
    this.showPanel = false;
  }

  switchPanel(): void {
    this.showPanel = !this.showPanel;
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  // ── 表單操作 ──────────────────────────────────────
  toggleSelection(list: string[], item: string): void {
    const idx = list.indexOf(item);
    idx > -1 ? list.splice(idx, 1) : list.push(item);
  }

  isSelected(list: string[], item: string): boolean {
    return list.includes(item);
  }

  submitWish(): void {
    // ── 驗證 ──
    if (!this.wishForm.title.trim()) {
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
      }).then((result) => {
        if (result.isConfirmed) Swal.fire({
          title: "Deleted!",
          text: "Your file has been deleted.",
          icon: "success"
        });
      });
      return;
    }
    if (this.wishForm.budgetMin !== null && this.wishForm.budgetMax !== null) {
      if (this.wishForm.budgetMin > this.wishForm.budgetMax) {
        alert('預算最低不可高於最高！');
        return;
      }
    }

    // ── 取得 userId ──
    const userId = this.userService.currentUser()?.userId;
    if (!userId) {
     Swal.fire({
        title: "請先登入",
        text: "登入後才能使用許願功能",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
      }).then((result) => {
        if (result.isConfirmed) Swal.fire({
          title: "Deleted!",
          text: "Your file has been deleted.",
          icon: "success"
        });
      });
      return;
    }

    // ── 組後端需要的 payload（對應 WishReq）──
    const payload: WishReq = {
      title:       this.wishForm.title.trim(),
      description: this.wishForm.description.trim(),
      budgetMin:   this.wishForm.budgetMin ?? 0,
      budgetMax:   this.wishForm.budgetMax ?? 0,
    };

    this.isSubmitting = true;
    this.submitError = '';

    this.http
      .post<any>(
        `${this.wishApiUrl}/insert?userId=${userId}`,
        payload,
        { withCredentials: true }
      )
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;

          // 後端若回傳非 200 statusCode 視為失敗
          if (res?.statusCode && res.statusCode !== 200) {
            this.submitError = res.message ?? '送出失敗，請稍後再試';
            return;
          }

          // ── 成功：將新許願加到列表最前面 ──
          const currentUser = this.userService.currentUser();
          const newWish: Wish = {
            id: res?.data?.id ?? Date.now(),
            userId,
            title:       payload.title,
            description: payload.description,
            location:    [...this.wishForm.location],
            budgetMin:   payload.budgetMin,
            budgetMax:   payload.budgetMax,
            status:      'active',
            createdAt:   new Date().toISOString(),
            expiredAt:   this.wishForm.expiredAt,
            wisher: {
              userId,
              userName:    currentUser?.userName ?? '我',
              school:      currentUser?.school   ?? '',
              userImgPath: currentUser?.userImgPath ?? '',
              department:  currentUser?.department  ?? '',
              goodLevel:   currentUser?.goodLevel   ?? 0,
            }
          };

          this.wishList = [newWish, ...this.wishList];
          this.closePanel();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.submitError = '網路錯誤，請稍後再試';

          Swal.fire({
            icon: "error",
            title: this.submitError,
            text: "伺服器連線錯誤或系統更新中",
          });
        }
      });
  }

  // ── 其他 ──────────────────────────────────────────
  chat(): void { this.router.navigate(['/chat']); }

  private emptyForm(): WishForm {
    return {
      title: '',
      description: '',
      location: [],
      budgetMin: null,
      budgetMax: null,
      expiredAt: '',
    };
  }

  get cities(): any[] {
    return this.ctgService.cities;
  }
}
