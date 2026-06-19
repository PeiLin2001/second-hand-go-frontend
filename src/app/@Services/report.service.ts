import { UserService } from './user.service';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FrontReportComponent } from '../@component/front-report/front-report.component';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

export interface ReportDialogData {
  type: 'product' | 'user'; // 決定預設顯示哪個 tab
  accusedName: string; // 被檢舉者名稱
  accusedId: string; // 被檢舉者 ID
  productId?: string; // 商品 ID（商品檢舉才需要）
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(private dialog: MatDialog,
    private userService: UserService,
    private router: Router,
  ) { }

  /**
   * 開啟檢舉 Dialog
   * @param type     'product' = 檢舉商品 | 'user' = 檢舉用戶
   * @param accusedName  被檢舉者名稱
   * @param accusedId    被檢舉者 ID
   * @param productId   商品 ID（檢舉商品時才傳）
   */
  openReportDialog(
    type: 'product' | 'user',
    accusedName: string,
    accusedId: string,
    productId?: string,
  ) {
    if (!this.userService.isLoggedIn()) {
      Swal.fire({
        title: '請先登入',
        text: '檢舉功能需要登入後才能使用喔！',
        icon: 'warning',
        confirmButtonText: '前往登入',
        confirmButtonColor: '#F7D175',
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login_register']);
        }
      });
      return;
    }

    this.dialog.open(FrontReportComponent, {
      width: '700px',
      disableClose: true, // 點外部不關閉，防止誤觸
      panelClass: 'report-dialog',
      data: {
        type,
        accusedName,
        accusedId,
        productId,
      } as ReportDialogData,
    });
  }
}
