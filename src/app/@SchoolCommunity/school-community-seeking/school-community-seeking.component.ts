import {
  WishServiceService,
  Wisher,
  WishForm,
  WishReq,
  WishInsertRes,
} from './../../@Services/wish-service.service';

import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EduApiGovService } from '../../@Services/edu-api-gov.service';
import { UserService } from '../../@Services/user.service';
import { Wish } from './../../@Services/wish-service.service';
import { FormsModule } from '@angular/forms';

import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  Plus,
  X,
} from 'lucide-angular';

import { WishCardComponent } from '../../@component/wish-card/wish-card.component';
import { CategoriesService } from '../../@Services/categories.service';
import Swal from 'sweetalert2';
import { catchError, EMPTY, finalize, switchMap } from 'rxjs';

@Component({
  selector: 'app-school-community-seeking',
  imports: [LucideAngularModule, WishCardComponent, FormsModule],
  templateUrl: './school-community-seeking.component.html',
  styleUrl: './school-community-seeking.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({ Plus, X }),
    },
  ],
})
export class SchoolCommunitySeekingComponent {
  wishList: Wish[] = [];

  showPanel = false;
  isSubmitting = false;
  submitted = false;
  submitError = '';

  wishForm: WishForm = this.emptyForm();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private eduApiGovService: EduApiGovService,
    private userService: UserService,
    protected ctgService: CategoriesService,
    private wishServiceService: WishServiceService,
  ) {}

  ngOnInit(): void {
    this.loadWishesByCurrentSchool();
  }

  // ── 初始化資料 ─────────────────────────────────────

  private loadWishesByCurrentSchool(): void {
    const schoolId = Number(this.route.parent?.snapshot.paramMap.get('id'));

    if (!schoolId) return;

    this.eduApiGovService
      .getSchools()
      .pipe(
        switchMap((schools) => {
          const school = schools.find((s) => Number(s['代碼']) === schoolId);

          if (!school) return EMPTY;

          return this.wishServiceService.getWishesBySchool(school['學校名稱']);
        }),
        catchError(() => {
          this.wishList = [];
          return EMPTY;
        }),
      )
      .subscribe((res) => {
        this.wishList = res.wishesList ?? [];
      });
  }

  // ── 面板操作 ─────────────────────────────────────

  switchPanel(): void {
    if (!this.isLoggedIn()) {
      this.showLoginAlert();
      return;
    }

    this.showPanel = !this.showPanel;

    if (this.showPanel) {
      this.resetFormState();
    }
  }

  closePanel(): void {
    this.showPanel = false;
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  // ── 表單操作 ─────────────────────────────────────

  toggleSelection(list: string[], item: string): void {
    const index = list.indexOf(item);

    index > -1 ? list.splice(index, 1) : list.push(item);
  }

  isSelected(list: string[], item: string): boolean {
    return list.includes(item);
  }

  submitWish(): void {
    this.submitted = true;

    if (!this.validateWishForm()) return;

    const userId = this.getCurrentUserId();

    if (!userId) {
      this.showLoginAlert();
      return;
    }

    const payload = this.createWishPayload();

    this.isSubmitting = true;
    this.submitError = '';

    this.wishServiceService
      .addWish(payload, userId)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (res) => this.handleSubmitSuccess(res, payload, userId),
        error: (err) => this.handleSubmitError(err),
      });
  }

  private validateWishForm(): boolean {
    const missingFields = this.getMissingFields();

    if (missingFields.length > 0) {
      Swal.fire({
        title: '尚有欄位未填寫！',
        html: `請填寫以下必填欄位：<br><b>${missingFields.join('、')}</b>`,
        icon: 'warning',
        confirmButtonText: '確定',
      });

      return false;
    }

    const { budgetMin, budgetMax } = this.wishForm;

    if (budgetMin === 0 && budgetMax === 0) {
      return true;
    }

    if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
      Swal.fire({
        title: '預算範圍錯誤！',
        text: '預算最低不可高於最高',
        icon: 'warning',
        confirmButtonText: '確定',
      });

      return false;
    }

    return true;
  }

  // 用來記錄畫面上是否勾選了面議
  get isNegotiable(): boolean {
    return this.wishForm.budgetMin === 0 && this.wishForm.budgetMax === 0;
  }

  // 用來記錄畫面上是否勾選了面議
  toggleNegotiable(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.wishForm.budgetMin = 0;
      this.wishForm.budgetMax = 0;
    } else {
      this.wishForm.budgetMin = null;
      this.wishForm.budgetMax = null;
    }
  }

  private getMissingFields(): string[] {
    const missing: string[] = [];

    if (!this.wishForm.title.trim()) missing.push('許願標題');
    if (!this.wishForm.description.trim()) missing.push('詳細說明');
    if (this.wishForm.location.length === 0) missing.push('偏好交易地點');
    if (this.wishForm.budgetMin === null) missing.push('預算最低');
    if (this.wishForm.budgetMax === null) missing.push('預算最高');
    if (!this.wishForm.status.trim()) missing.push('瀏覽權限');

    return missing;
  }

  private createWishPayload(): WishReq {
    return {
      title: this.wishForm.title.trim(),
      description: this.wishForm.description.trim(),
      location: [...this.wishForm.location],
      budgetMin: this.wishForm.budgetMin ?? 0,
      budgetMax: this.wishForm.budgetMax ?? 0,
      status: this.wishForm.status,
    };
  }

  private handleSubmitSuccess(
    res: WishInsertRes,
    payload: WishReq,
    userId: number,
  ): void {
    if (res.statusCode === 429) {
      this.showWishLimitAlert();
      return;
    }

    if (res.statusCode && res.statusCode !== 200) {
      this.showSubmitFailedAlert();
      return;
    }

    this.loadWishesByCurrentSchool();

    this.submitted = false;
    this.closePanel();

    Swal.fire({
      title: '許願成功！',
      icon: 'success',
      confirmButtonText: '確定',
    });
  }

  private handleSubmitError(err: any): void {
    this.submitError = '網路錯誤，請稍後再試';

    if (err.status === 429) {
      this.showWishLimitAlert();
      return;
    }

    Swal.fire({
      icon: 'error',
      title: this.submitError,
      text: '伺服器連線錯誤或系統更新中',
    });
  }

  private createLocalWish(
    res: WishInsertRes,
    payload: WishReq,
    userId: number,
  ): Wish {
    const currentUser = this.userService.currentUser();

    return {
      id: res.data?.id ?? Date.now(),
      userId,
      title: payload.title,
      description: payload.description,
      location: [...payload.location],
      budgetMin: payload.budgetMin,
      budgetMax: payload.budgetMax,
      status: payload.status,
      createdAt: new Date().toISOString(),
      expiredAt: this.wishForm.expiredAt,
      wisher: {
        userId,
        userName: currentUser?.userName ?? '我',
        school: currentUser?.school ?? '',
        userImgPath: currentUser?.userImgPath ?? '',
        department: currentUser?.department ?? '',
        goodLevel: currentUser?.goodLevel ?? 0,
      },
    };
  }

  // ── 共用提示 ─────────────────────────────────────

  private showLoginAlert(): void {
    Swal.fire({
      title: '請先登入',
      text: '登入後才能使用許願功能',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: '前往登入',
      cancelButtonText: '取消',
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/login_register'], {
          queryParams: { mode: 'login' },
        });
      }
    });
  }

  private showWishLimitAlert(): void {
    Swal.fire({
      title: '已達許願額度上限!',
      text: '您已超過今日的許願次數限制，每日最多可許願三次',
      icon: 'warning',
      confirmButtonText: '確定',
    });
  }

  private showSubmitFailedAlert(): void {
    Swal.fire({
      title: '送出失敗!',
      text: '送出失敗，請稍後再試',
      icon: 'warning',
      confirmButtonText: '確定',
    });
  }

  // ── 其他 ─────────────────────────────────────

  chat(): void {
    this.router.navigate(['/chat']);
  }

  private isLoggedIn(): boolean {
    return !!this.getCurrentUserId();
  }

  private getCurrentUserId(): number | undefined {
    return this.userService.currentUser()?.userId;
  }

  private resetFormState(): void {
    this.wishForm = this.emptyForm();
    this.submitError = '';
    this.submitted = false;
  }

  private emptyForm(): WishForm {
    return {
      title: '',
      description: '',
      location: [],
      budgetMin: null,
      budgetMax: null,
      expiredAt: '',
      status: 'active',
    };
  }

  get cities(): any[] {
    return this.ctgService.cities;
  }
}
