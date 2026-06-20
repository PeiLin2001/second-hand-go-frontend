import { Component, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Wish } from '../../@Services/wish-service.service';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  MessageCircleMore,
   EllipsisVertical,
  Flag,
} from 'lucide-angular';
import { ReportService } from '../../@Services/report.service';
import { DecimalPipe } from '@angular/common';

import {
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-wish-card',
  imports: [LucideAngularModule, DecimalPipe, RouterLink],
  templateUrl: './wish-card.component.html',
  styleUrl: './wish-card.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({ MessageCircleMore,  EllipsisVertical, Flag }),
    },
  ],
})
export class WishCardComponent implements AfterViewInit, OnChanges {
  @Input() wishList: Wish[] = [];

  @ViewChildren('wishDescription')
  wishDescriptionEls!: QueryList<ElementRef<HTMLElement>>;

  openMenuWishId: number | null = null;
  expandedIds = new Set<number>();
  expandableIds = new Set<number>();

  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private router: Router,
    private reportService: ReportService,
  ) {}

  ngAfterViewInit(): void {
    this.scheduleExpandableCheck();

    this.wishDescriptionEls.changes.subscribe(() => {
      this.scheduleExpandableCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['wishList']) {
      this.scheduleExpandableCheck();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }

    this.resizeTimer = setTimeout(() => {
      this.scheduleExpandableCheck();
    }, 150);
  }

  chat(): void {
    this.router.navigate(['/chat']);
  }

  toggleMenu(event: Event, item: Wish): void {
    event.stopPropagation();
    this.openMenuWishId = this.openMenuWishId === item.id ? null : item.id;
  }

  toggleExpand(id: number): void {
    const next = new Set(this.expandedIds);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    this.expandedIds = next;
  }

  goRepot(item: Wish): void {
    if (!item?.wisher) return;

    this.openMenuWishId = null;
    this.reportService.openReportDialog(
      'user',
      item.wisher.userName,
      item.wisher.userId.toString()
    );
  }

  @HostListener('document:click')
  closeAll(): void {
    this.openMenuWishId = null;
  }

  private scheduleExpandableCheck(): void {
    requestAnimationFrame(() => {
      this.updateExpandableState();
    });
  }

  private updateExpandableState(): void {
    if (!this.wishDescriptionEls) return;

    const nextExpandableIds = new Set<number>();

    this.wishDescriptionEls.forEach((ref, index) => {
      const item = this.wishList[index];
      if (!item) return;

      const el = ref.nativeElement;
      const style = window.getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight);
      const twoLineHeight = lineHeight * 2;

      const isOverTwoLines = el.scrollHeight > twoLineHeight + 2;

      if (isOverTwoLines) {
        nextExpandableIds.add(item.id);
      }
    });

    this.expandableIds = nextExpandableIds;

    this.expandedIds.forEach((id) => {
      if (!nextExpandableIds.has(id)) {
        this.expandedIds.delete(id);
      }
    });
  }
}
