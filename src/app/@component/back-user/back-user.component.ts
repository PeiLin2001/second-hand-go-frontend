import { map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  LucideAngularModule,
  Search,
  MapPin,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
} from 'lucide-angular';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { PaginationService } from '../../@Services/pageination.service';
import { HttpService } from '../../@Services/http.service';

@Component({
  selector: 'app-back-user',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './back-user.component.html',
  styleUrl: './back-user.component.scss',
})
export class BackUserComponent {
  constructor(
    public pagination: PaginationService,
    private dialog: MatDialog,
    public http: HttpService,
  ) {}
  readonly SearchIcon = Search;
  readonly mapIcon = MapPin;
  readonly GridIcon = LayoutGrid;
  readonly nextIcon = ChevronRight;
  readonly prevIcon = ChevronLeft;

  readonly pageSize = 5;

  // 篩選選項
  accountStatuses = ['未驗證', '正常', '停權'];
  verifyStatuses = ['已驗證', '已過期'];

  selectedAccountStatus = '';
  selectedVerifyStatus = '';

  private allUsers: User[] = [];

  users: User[] = [];

  ngOnInit() {
    this.http
      .getApi('http://localhost:8080/user/getUsers')
      .subscribe((res: any) => {
        if (res.statusCode == 200) {
          console.log(res);
          this.allUsers = res.user.map((u: any) => ({
            id: u.userId,
            name: u.userName,
            avatarUrl: u.imgPath, //頭像
            status: u.status, //狀態
            studentVerifiedAt: u.studentVerifiedAt, // 驗證日期，null 表示未驗證
            location: u.location,
            banReason: u.note,
          }));
          this.pagination.init(this.allUsers.length, this.pageSize);
          this.applyFilter();
        }
      });

  }

  loadUsers() {
    const start = (this.pagination.currentPage - 1) * this.pageSize;
    this.users = this.allUsers.slice(start, start + this.pageSize);
  }
  // 驗證日期 → 驗證狀態
  getVerifyStatus(verifiedAt: string, accountstatuses: string): string {
    // if (!verifiedAt) return '未驗證';
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return new Date(verifiedAt) < oneYearAgo ? '已過期' : '已驗證';
  }

  getAccountBadge(status: string): string {
    const map: Record<string, string> = {
      未驗證: 'badge-unverified',
      正常: 'badge-normal',
      停權: 'badge-banned',
    };
    return map[status] ?? '';
  }

  getVerifyBadge(verifiedAt: string, accountstatuses: string): string {
    const status = this.getVerifyStatus(verifiedAt, accountstatuses);
    const map: Record<string, string> = {
      已驗證: 'badge-verified',
      已過期: 'badge-expired',
    };
    return map[status] ?? '';
  }

  // 篩選
  selectAccountStatus(status: string) {
    this.selectedAccountStatus =
      this.selectedAccountStatus === status ? '' : status;
    this.applyFilter();
  }

  selectVerifyStatus(status: string) {
    this.selectedVerifyStatus =
      this.selectedVerifyStatus === status ? '' : status;
    this.applyFilter();
  }
  applyFilter(keepPage = false) {
    let filtered = this.allUsers;

    if (this.selectedAccountStatus) {
      filtered = filtered.filter(
        (u) => u.status === this.selectedAccountStatus,
      );
    }

    if (this.selectedVerifyStatus) {
      filtered = filtered.filter(
        (u) =>
          this.getVerifyStatus(u.studentVerifiedAt, u.status) ===
          this.selectedVerifyStatus,
      );
    }

    const currentPage = this.pagination.currentPage;

    this.pagination.init(filtered.length, this.pageSize);

    if (keepPage) {
      this.pagination.currentPage = Math.min(
        currentPage,
        this.pagination.totalPages,
      );
    }

    const start = (this.pagination.currentPage - 1) * this.pageSize;

    this.users = filtered.slice(start, start + this.pageSize);
  }

  viewUser(user: User) {
    this.http.getApi(`http://localhost:8080/user/getByUserId?userId=${user.id}`).
    subscribe((res:any)=>{
      if(res.statusCode==200){
        console.log(res);
        const user={
          name:res.user.userName,
          id:res.user.userId,
          email:res.user.userEmail,
          phone:res.user.phone,
          location:res.user.location,
          school:res.user.school,
          department:res.user.department,
          status:res.user.status,
          studentVerifiedAt:res.user.verified,
          goodLevel:res.user.goodLevel,
          msg:res.user.msg,
          banReason:res.user.note,
          avatarUrl:res.user.imgPath,
        }
        this.dialog.open(UserDialogComponent, { data: user });
      }
    })
  }

  unbanned(user: User) {
    this.http.postApi(`http://localhost:8080/user/changeStatus`,user.id).subscribe((res:any)=>{
      if(res.statusCode==200){
        // 找到那筆資料並更新狀態
        const idx = this.allUsers.findIndex(u => u.id === user.id);
        if (idx !== -1) {
          this.allUsers[idx].status = '正常';
        }
        this.applyFilter(true);
      }
    })

  }

  prevPage() {
    if (this.pagination.prevPage()) this.loadUsers();
  }
  nextPage() {
    if (this.pagination.nextPage()) this.loadUsers();
  }
  goToPage(page: number) {
    if (this.pagination.goToPage(page)) this.loadUsers();
  }
}

export interface User {
  id: number;
  name: string;
  avatarUrl: string; //頭像
  status: string; //狀態
  studentVerifiedAt: string; // 驗證日期，null 表示未驗證
  location: string;
  banReason?: string | null; // 停權原因，選填
}
