import { map } from 'rxjs';
import { ReportDialogComponent } from './../report-dialog/report-dialog.component';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, File, ChevronRight, ChevronLeft } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { PaginationService } from '../../@Services/pageination.service';
import { AnnounDialogComponent } from '../announcement-dialog/announcement-dialog.component';
import { HttpService } from '../../@Services/http.service';

@Component({
  selector: 'app-report',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss',
})
export class ReportComponent {
  constructor(public pagination: PaginationService,
    public dialog: MatDialog,
    public http:HttpService) {}

  readonly panelsIcon = File;
  readonly nextIcon = ChevronRight;
  readonly prevIcon = ChevronLeft;
  readonly pageSize = 5;

  searchQuery: string = '';
  pendingCount: number = 0;
  disputes: Dispute[] = [];

  activeTab: 'pending' | 'done' = 'pending';

  private allDisputes: Dispute[] = [
    { reportId: 1,  productId: 101, productName: '快樂羊駝玩偶',     accusedId: 3,  accusedName: 'Bob Wang',    compId: 1,  compName: 'Alice Chen',  reportDate: '2026-04-10', status: '待處理', type: '商品',   violationType: '描述不符', filePath: ['https://placehold.co/400x300?text=商品顏色尺寸不符'], description: '商品與描述嚴重不符，實際收到的顏色和尺寸都不對。',         note: null },
    { reportId: 2,  productId: null, productName: null,              accusedId: 4,  accusedName: 'David Wu',    compId: 2,  compName: 'Carol Lin',   reportDate: '2026-04-18', status: '待處理', type: '使用者', violationType: '未出貨',   filePath: ['https://placehold.co/400x300?text=賣家未回應截圖'], description: '付款後超過兩週賣家未出貨也未回應。',                       note: null },
    { reportId: 3,  productId: 102, productName: '羊駝羊毛氈包',     accusedId: 5,  accusedName: 'Frank Lee',   compId: 6,  compName: 'Eva Huang',   reportDate: '2026-04-25', status: '待處理', type: '商品',   violationType: '瑕疵品',   filePath: ['https://placehold.co/400x300?text=包裝破損照片'],                                      description: '收到商品時包裝破損，內部商品有明顯刮傷與污漬。',           note: null },
    { reportId: 4,  productId: null, productName: null,              accusedId: 7,  accusedName: 'Henry Liu',   compId: 8,  compName: 'Grace Tsai',  reportDate: '2026-05-01', status: '待處理', type: '使用者', violationType: '拒絕退款', filePath: ['https://placehold.co/400x300?text=退款拒絕截圖'], description: '商品有問題申請退款，賣家持續拒絕並封鎖買家。',               note: null },
    { reportId: 5,  productId: 103, productName: '限定版草泥馬公仔', accusedId: 9,  accusedName: 'James Hsu',   compId: 10, compName: 'Iris Chang',  reportDate: '2026-05-08', status: '待處理', type: '商品',   violationType: '仿冒品',   filePath: ['https://placehold.co/400x300?text=仿冒品與正品對比'], description: '懷疑商品為仿冒品，與官方正品做工及標籤有明顯差異。',         note: null },
  ];

  private allDoneDisputes: Dispute[] = [
    // { reportId: 101, productId: 201, productName: '羊駝鑰匙圈',     accusedId: 13, accusedName: 'Nick Ho',     compId: 14, compName: 'Mary Su',     reportDate: '2026-03-05', status: '已駁回', type: '商品',   violationType: '描述不符', filePath: ['https://placehold.co/400x300?text=商品描述頁面截圖'],                                      description: '買家認為顏色不符，但商品頁面照片標示清楚。',               note: '經查商品頁面已清楚標示顏色，駁回檢舉。' },
    // { reportId: 102, productId: 202, productName: '迷你草泥馬擺件', accusedId: 15, accusedName: 'Penny Cheng', compId: 16, compName: 'Oscar Liao',  reportDate: '2026-03-12', status: '已下架', type: '商品',   violationType: '仿冒品',   filePath: ['https://placehold.co/400x300?text=仿冒品外觀照片'], description: '商品外觀與知名品牌高度相似，疑似仿冒。',                     note: '確認為仿冒品，強制下架並警告賣家帳號。' },
    // { reportId: 103, productId: null, productName: null,            accusedId: 17, accusedName: 'Ray Lin',     compId: 18, compName: 'Quinn Tseng', reportDate: '2026-03-20', status: '已停權', type: '使用者', violationType: '未出貨',   filePath: ['https://placehold.co/400x300?text=未出貨訂單截圖'],                                      description: '賣家三筆訂單均未出貨且無回應，已有多筆客訴。',             note: '累計三筆未出貨紀錄，停權處理並通知買家退款。' },
    // { reportId: 104, productId: null, productName: null,            accusedId: 19, accusedName: 'Tom Chen',    compId: 20, compName: 'Sara Wu',     reportDate: '2026-03-28', status: '已駁回', type: '使用者', violationType: '惡意評價', filePath: ['https://placehold.co/400x300?text=惡意評價截圖'], description: '買家給予惡意一星評價且留言具攻擊性。',                       note: '評價內容確有違規，已移除該評價，但交易本身無問題，駁回檢舉。' },
  ];

  private get source(): Dispute[] {
    return this.activeTab === 'pending' ? this.allDisputes : this.allDoneDisputes;
  }

  private get filtered(): Dispute[] {
    if (!this.searchQuery) return this.source;
    return this.source.filter(d =>
      String(d.reportId).includes(this.searchQuery) ||
      d.productName?.includes(this.searchQuery) ||
      d.compName.includes(this.searchQuery) ||
      d.accusedName.includes(this.searchQuery)
    );
  }

  ngOnInit() {
    this.http.getApi('http://localhost:8080/report/getAllReport').
    subscribe((res:any)=>
    {if(res.statusCode==200){
      console.log(res);

      const allData:Dispute[]=res.reports.map((r:any)=>({
        reportId: r.reportId,
        productId: r.productId || null,
        productName: null,
        accusedId: r.accusedId,
        accusedName: r.accusedName||'',
        compId: 0,
        compName: r.complainantName||'',
        description: '',
        filePath: [],
        reportDate: r.reportDate,
        status: r.status,
        type: r.type,
        violationType: '',
        note: null,
      }));
      //分類狀態
      this.allDisputes=allData.filter(d => d.status==='未處理');
      this.allDoneDisputes=allData.filter(d=>d.status!=='未處理');

      //計算分頁數
      this.pagination.init(this.source.length, this.pageSize);
      this.loadDisputes();
    }
    });
  }

  loadDisputes() {
    const data = this.filtered;
    this.pendingCount = data.length;
    const start = (this.pagination.currentPage - 1) * this.pageSize;
    this.disputes = data.slice(start, start + this.pageSize);
  }

  switchTab(tab: 'pending' | 'done') {
    this.activeTab = tab;
    this.searchQuery = '';
    this.pagination.init(this.source.length, this.pageSize);
    this.loadDisputes();
  }

  search() {
    this.pagination.init(this.filtered.length, this.pageSize);
    this.loadDisputes();
  }

  viewReason(dispute: Dispute) {
    console.log(dispute.reportId);
    this.http.getApi(
      `http://localhost:8080/report/getReportById?reportId=${dispute.reportId}`).
      subscribe((res:any)=>{
        console.log(res);
        if(res.statusCode==200){
          console.log(res.report.filePath);
          const fullData={
            reportId: res.report.reportId,
            productId: res.report.productId,
            productName: res.report.productName,
            accusedId: res.report.accusedId,
            accusedName: res.report.accusedName,
            compName: res.report.complainantName,
            description: res.report.description,
            filePath: res.report.filePath,
            reportDate: res.report.reportDate,
            status: res.report.status,
            type: res.report.type,
            violationType: res.report.violationType,
            note: res.report.note,
          };
          console.log('傳進dialog的資料:', fullData);
          const dialogRef = this.dialog.open(ReportDialogComponent, { data: fullData });

          dialogRef.afterClosed().subscribe(result => {
            if (!result) return;
            const idx = this.allDisputes.findIndex(d => d.reportId === dispute.reportId);
            if (idx !== -1) this.allDisputes.splice(idx, 1);

            let finalStatus = '';
            if (result.action === '駁回') {
              finalStatus = '已駁回';
            } else if (result.action === '通過') {
              finalStatus = dispute.type === '商品' ? '已下架' : '已停權';
            }

            this.allDoneDisputes.unshift({ ...dispute, status: finalStatus, note: result.note || null });

            this.pagination.init(this.source.length, this.pageSize);
            this.loadDisputes();
        });
        }

    });
  }

  // reject(dispute: Dispute) {
  //   const confirmRef = this.dialog.open(AnnounDialogComponent);
  //   confirmRef.afterClosed().subscribe(confirmed => {
  //     if (!confirmed) return;

  //     const idx = this.allDisputes.findIndex(d => d.reportId === dispute.reportId);
  //     if (idx !== -1) this.allDisputes.splice(idx, 1);

  //     this.allDoneDisputes.unshift({ ...dispute, status: '已駁回', note: null });

  //     this.pagination.init(this.source.length, this.pageSize);
  //     this.loadDisputes();
  //   });
  // }

  // approve(dispute: Dispute) {
  //   const confirmRef = this.dialog.open(AnnounDialogComponent);
  //   confirmRef.afterClosed().subscribe(confirmed => {
  //     if (!confirmed) return;

  //     const idx = this.allDisputes.findIndex(d => d.reportId === dispute.reportId);
  //     if (idx !== -1) this.allDisputes.splice(idx, 1);

  //     const finalStatus = dispute.type === '商品' ? '已下架' : '已停權';
  //     this.allDoneDisputes.unshift({ ...dispute, status: finalStatus, note: null });

  //     this.pagination.init(this.source.length, this.pageSize);
  //     this.loadDisputes();
  //   });
  // }

  prevPage()  { if (this.pagination.prevPage())           this.loadDisputes(); }
  nextPage()  { if (this.pagination.nextPage())           this.loadDisputes(); }
  goToPage(page: number) { if (this.pagination.goToPage(page)) this.loadDisputes(); }
}

export interface Dispute {
  reportId: number;
  productId: number | null;
  productName: string | null;
  accusedId: number;
  accusedName: string;
  compId: number;
  compName: string;
  description: string;
  filePath: string[] ;
  reportDate: string;
  status: string;
  type: string;
  violationType: string;
  note: string | null;
}
