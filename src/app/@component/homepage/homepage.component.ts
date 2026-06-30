import { ManualComponent } from './../manual/manual.component';
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
} from '@angular/core';

// 素材庫
import { LucideAngularModule } from 'lucide-angular';

import { ProductCardComponent } from '../product-card/product-card.component';
import { Router } from '@angular/router';
import { ProductCard } from '../../@Interface/product-card';
import { ProductServiceService } from '../../@Services/product-service.service';
import { CategoriesService } from '../../@Services/categories.service';
import { HttpService } from '../../@Services/http.service';
import { AnnoundialogComponent } from '../announdialog/announdialog.component';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-homepage',
  imports: [LucideAngularModule, ProductCardComponent, ManualComponent],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
})
export class HomepageComponent {
  constructor(
    private route: Router,
    private productService: ProductServiceService,
    private category: CategoriesService,
    private ngZone: NgZone,
    private http: HttpService,
    private dialog: MatDialog,
  ) {}

  get categories(): any[] {
    return this.category.categories;
  }

  announ: Announcement[] = [];
  ngOnInit(): void {
    //接上API取得發布中的公告
    this.http
      .getApi(`${environment.apiUrl}/announce/getActive`)
      .subscribe((res: any) => {
        if (res.statusCode == 200) {
          this.announ = res.data;
        }
      });
    this.loadProducts();
  }

  //類型輪播效果
  @ViewChild('categoryScroll')
  categoryScroll!: ElementRef;

  openAnnou(item: any) {
    console.log(item);
    this.http
      .getApi(`${environment.apiUrl}/announce/getId?announceId=${item.id}`)
      .subscribe((res: any) => {
        if (res.statusCode == 200) {
          console.log(res);
          this.dialog.open(AnnoundialogComponent, {
            disableClose: true,
            data: res.data,
            width: '50vw',
            maxWidth: '90vw',
            maxHeight: '90vh',
            panelClass: 'custom-announ-dialog',
          });
        }
      });
  }

  scrollLeft() {
    this.categoryScroll.nativeElement.scrollBy({
      left: -300,
      behavior: 'smooth',
    });
  }

  scrollRight() {
    this.categoryScroll.nativeElement.scrollBy({
      left: 300,
      behavior: 'smooth',
    });
  }

  showNavBtns = false;
  private resizeObserver!: ResizeObserver;

  ngAfterViewInit(): void {
    // 用 setTimeout 確保 DOM 完全渲染後再初始化
    setTimeout(() => {
      this.checkOverflow();

      this.resizeObserver = new ResizeObserver(() => {
        // 用 NgZone 確保 Angular 變更偵測被觸發
        this.ngZone.run(() => this.checkOverflow());
      });

      this.resizeObserver.observe(this.categoryScroll.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  checkOverflow(): void {
    const el = this.categoryScroll.nativeElement;
    // scrollWidth > clientWidth 代表內容超出容器，需要捲動
    this.showNavBtns = el.scrollWidth > el.clientWidth;
  }

  // 使用說明
  @ViewChild('manualSection')
  manualSection!: ElementRef;

  goToManual() {
    this.manualSection.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  // 路由設定
  goToProductListById(type: string) {
    this.route.navigate(['/product-list', type]);
  }

  get homeProducts(): ProductCard[] {
    return this.allProducts.slice(0, 5);
  }

  allProducts: ProductCard[] = [];

  loadProducts() {
    return this.productService.getAll().subscribe({
      next: (res) => {
        this.allProducts = res.productList;
      },
      error: (err) => {
        console.error(err);
        console.log(err.message);
      },
    });
  }
}

export interface Announcement {
  id: number;
  title: string;
  shelfDate: string;
  removalDate: string;
  publish: boolean;
  content?: string;
  imgPath: string;
}
