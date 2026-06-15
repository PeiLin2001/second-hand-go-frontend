import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Newspaper,
  ChevronRight,
  ChevronLeft,
  Plus,
} from 'lucide-angular';
import { PaginationService } from '../../@Services/pageination.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddannounceDaialogComponent } from '../addannounce-daialog/addannounce-daialog.component';
import { HttpService } from '../../@Services/http.service';

@Component({
  selector: 'app-announcement',
  imports: [CommonModule, FormsModule, LucideAngularModule, MatDialogModule],
  templateUrl: './announcement.component.html',
  styleUrl: './announcement.component.scss',
})
export class AnnouncementComponent {
  constructor(
    private dialog: MatDialog,
    public http: HttpService,
  ) {}

  readonly addInco = Plus;
  readonly newpaperIcon = Newspaper;
  readonly nextIcon = ChevronRight;
  readonly prevIcon = ChevronLeft;

  readonly pageSize = 5;

  // 兩個獨立的分頁實例，互不干擾
  activePagination = new PaginationService();
  pastPagination = new PaginationService();
  neverPagination = new PaginationService();

  activeAnnouncements: Announcement[] = [];
  pastAnnouncements: Announcement[] = [];
  neverAnnouncements: Announcement[] = [];

  private allAnnouncements: Announcement[] = [];

  private get today(): string {
    return new Date().toLocaleDateString('en-CA'); // 直接回傳 YYYY-MM-DD 格式
  }

  private get activeList(): Announcement[] {
    return this.allAnnouncements.filter(
      (a) =>
        a.endDate >= this.today && a.isPublished && a.startDate <= this.today,
    );
  }
  private get pastList(): Announcement[] {
    return this.allAnnouncements.filter(
      (a) => a.endDate < this.today && a.isPublished,
    );
  }
  private get neverList(): Announcement[] {
    return this.allAnnouncements.filter((a) => {
        !a.isPublished || (a.isPublished && a.startDate > this.today);
    });
  }

  loadFromAPI() {
    this.http
      .getApi('http://localhost:8080/announce/getAll')
      .subscribe((res: any) => {
        if (res.statusCode == 200) {
          console.log(res.data);
          this.allAnnouncements = res.data.map((a: any) => {
            console.log('isPublished:', a.publish);
            return {
              id: a.id,
              title: a.title,
              startDate: a.shelfDate,
              endDate: a.removalDate,
              isPublished: a.publish,
              content: a.content,
              imgPath: a.imgPath ?? null,
            };
          });
          this.reloadAll();
        }
      });
  }
  ngOnInit() {
    this.loadFromAPI();
  }

  loadActive() {
    const start = (this.activePagination.currentPage - 1) * this.pageSize;
    this.activeAnnouncements = this.activeList.slice(
      start,
      start + this.pageSize,
    );
  }
  loadPast() {
    const start = (this.pastPagination.currentPage - 1) * this.pageSize;
    this.pastAnnouncements = this.pastList.slice(start, start + this.pageSize);
  }
  loadNever() {
    const start = (this.neverPagination.currentPage - 1) * this.pageSize;
    this.neverAnnouncements = this.neverList.slice(
      start,
      start + this.pageSize,
    );
  }

  activePrev() {
    if (this.activePagination.prevPage()) this.loadActive();
  }
  activeNext() {
    if (this.activePagination.nextPage()) this.loadActive();
  }
  activeGoTo(page: number) {
    if (this.activePagination.goToPage(page)) this.loadActive();
  }

  pastPrev() {
    if (this.pastPagination.prevPage()) this.loadPast();
  }
  pastNext() {
    if (this.pastPagination.nextPage()) this.loadPast();
  }
  pastGoTo(page: number) {
    if (this.pastPagination.goToPage(page)) this.loadPast();
  }

  neverPrev() {
    if (this.neverPagination.prevPage()) this.loadNever();
  }
  neverNext() {
    if (this.neverPagination.nextPage()) this.loadNever();
  }
  neverGoTo(page: number) {
    if (this.neverPagination.goToPage(page)) this.loadNever();
  }

  reloadAll() {
    this.neverPagination.init(this.neverList.length, this.pageSize);
    this.activePagination.init(this.activeList.length, this.pageSize);
    this.pastPagination.init(this.pastList.length, this.pageSize);
    this.loadNever();
    this.loadActive();
    this.loadPast();
  }

  addAnnounce() {
    const dialogRef = this.dialog.open(AddannounceDaialogComponent, {
      width: '520px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.loadFromAPI();
    });
  }

  editAnnouncement(item: Announcement) {
    const dialogRef = this.dialog.open(AddannounceDaialogComponent, {
      width: '520px',
      data: item,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.loadFromAPI();
    });
  }
}

export interface Announcement {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  content?: string;
  imgPath: string;
}
