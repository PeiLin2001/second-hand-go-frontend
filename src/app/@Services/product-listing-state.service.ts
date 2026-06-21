import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Options } from '@angular-slider/ngx-slider';

import { ProductCard } from '../@Interface/product-card';
import { ProductServiceService, GetProductDataRes, SearchProductReq } from './product-service.service';
import { PaginationService } from './pageination.service';
import { CategoriesService } from './categories.service';
import { EighteenAcademyService } from './eighteen-academy.service';

const CATEGORY_MAP: Record<string, string> = {
  'books':       '教科書',
  'equipment':   '專業器材',
  'daily':       '日用品',
  'electronics': '3C電子',
  'furniture':   '家具家電',
  'notes':       '筆記考古',
  'fashion':     '服飾配件',
  'sports':      '戶外運動',
  'graduation':  '畢業季',
};

export { CATEGORY_MAP };

@Injectable({ providedIn: 'root' })
export class ProductListingStateService {

  // ── 狀態 ──────────────────────────────────────────────
  products: ProductCard[] = [];
  isLoading = false;

  category: string | null = 'all';
  searchReq: SearchProductReq = {};

  sortOption: 'newest' | 'price-asc' | 'price-desc' = 'newest';

  // ── Panel 開關（原本在 component，移來這裡讓 HTML 共用）──
  panelState = {
    sort:   false,
    filter: false,
  };

  // ── 預設值 ────────────────────────────────────────────
  readonly DEFAULT_FILTERS = {
    priceValue:     0,
    priceHighValue: 5000,
    sellerGrade:    1,
  } as const;

  priceValue     = this.DEFAULT_FILTERS.priceValue;
  priceHighValue = this.DEFAULT_FILTERS.priceHighValue;
  sellerGrade    = this.DEFAULT_FILTERS.sellerGrade;

  // ── Slider Options ────────────────────────────────────
  priceOptions: Options = {
    floor: 0,
    ceil: 5000,
    step: 200,
    translate: (value: number): string => {
      if (value >= 5000) return '$5,000+';
      return `$${value.toLocaleString()}`;
    }
  };

  sellerGradeOptions: Options = {
    showTicksValues: true,
    stepsArray: [
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
      { value: 5 }
    ]
  };

  constructor(
    private productservice: ProductServiceService,
    public  pagination: PaginationService,
    private ctgService: CategoriesService,
    private aca: EighteenAcademyService,
  ) {}

  // ── 資料來源 getter ────────────────────────────────────
  get type()       { return this.ctgService.categories; }
  get condition()  { return this.ctgService.conditions; }
  get department() { return this.aca.academy; }
  get cities()     { return this.ctgService.cities; }

  // ── 載入商品 ───────────────────────────────────────────
  loadProducts(): void {
    this.isLoading = true;
    const hasSearch = Object.keys(this.searchReq).length > 0;

    if (hasSearch) {
      this.handleResponse(this.productservice.search(this.searchReq));
    } else if (this.category && this.category !== 'all') {
      const chineseCat = CATEGORY_MAP[this.category] ?? this.category;
      this.handleResponse(this.productservice.searchByType(chineseCat));
    } else {
      this.handleResponse(this.productservice.getAll());
    }
  }

  loadByUniversity(universityName: string): void {
    this.isLoading = true;
    this.handleResponse(this.productservice.getByUniversity(universityName));
  }

  handleResponse(observable: Observable<GetProductDataRes>): void {
    observable.subscribe({
      next: (res) => {
        this.products = res.productList ?? [];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // ── 篩選邏輯 ───────────────────────────────────────────
  matchPrice(product: ProductCard): boolean {
    if (this.priceHighValue >= 5000) return product.price >= this.priceValue;
    return product.price >= this.priceValue && product.price <= this.priceHighValue;
  }

  matchCity(product: ProductCard): boolean {
    const selected = this.cities.filter(c => c.selected).map(c => c.name);
    return selected.length === 0 || selected.some(city => product.location.includes(city));
  }

  matchSchool(product: ProductCard): boolean {
    const selected = this.department.filter(d => d.selected).map(d => d.name);
    return selected.length === 0 || selected.some(s => product.deptGroup.includes(s));
  }

  matchType(product: ProductCard): boolean {
    const selected = this.type.filter(t => t.selected).map(t => CATEGORY_MAP[t.value]);
    return selected.length === 0 || selected.some(t => product.type.includes(t));
  }

  matchCondition(product: ProductCard): boolean {
    const selected = this.condition.filter(c => c.selected).map(c => c.label);
    return selected.length === 0 || selected.includes(product.condition);
  }

  matchCategory(product: ProductCard): boolean {
    const chineseCat = CATEGORY_MAP[this.category!];
    return (!this.searchReq.keyword && this.category !== 'all')
      ? product.type.includes(chineseCat)
      : true;
  }

  matchCreditScore(product: ProductCard): boolean {
    if (this.sellerGrade === this.DEFAULT_FILTERS.sellerGrade) {
      return true;
    }

    const goodLevel = Number(product.user?.goodLevel ?? 0);
    return goodLevel >= this.sellerGrade;
  }

  get filteredProducts(): ProductCard[] {
    return this.products.filter(p =>
      this.matchCategory(p) &&
      this.matchPrice(p) &&
      this.matchCity(p) &&
      this.matchSchool(p) &&
      this.matchType(p) &&
      this.matchCondition(p)&&
      this.matchCreditScore(p)
    );
  }

  get sortedProducts(): ProductCard[] {
    const list = [...this.filteredProducts];
    if (this.sortOption === 'price-asc')  return list.sort((a, b) => a.price - b.price);
    if (this.sortOption === 'price-desc') return list.sort((a, b) => b.price - a.price);
    return list;
  }

  // ── 分頁 ───────────────────────────────────────────────
  pageSize = 30;

  updatePagination(): void {
    this.pagination.init(this.filteredProducts.length, this.pageSize);
  }

  get pagedProducts(): ProductCard[] {
    const start = (this.pagination.currentPage - 1) * this.pageSize;
    return this.sortedProducts.slice(start, start + this.pageSize);
  }

  // ── Active Filter Tags ────────────────────────────────
  get priceLabel(): string {
    const isDefault = this.priceValue     === this.DEFAULT_FILTERS.priceValue
                   && this.priceHighValue === this.DEFAULT_FILTERS.priceHighValue;
    return isDefault ? '價格區間' : `$${this.priceValue} - $${this.priceHighValue}+`;
  }

  get conditionLabel(): string {
    const selected = this.condition.filter(c => c.selected).map(c => c.label);
    if (selected.length === 0) return '物況';
    if (selected.length <= 2) return selected.join('、');
    return `${selected[0]} 等 ${selected.length} 種`;
  }

  get gradeLabel(): string {
    return this.sellerGrade === this.DEFAULT_FILTERS.sellerGrade
      ? '賣家評價'
      : `評價 ${this.sellerGrade}★ 以上`;
  }

  get locationLabel(): string {
    const selected = this.cities.filter(c => c.selected).map(c => c.name);
    if (selected.length === 0) return '地區';
    if (selected.length <= 2) return selected.join('、');
    return `${selected[0]} 等 ${selected.length} 個地區`;
  }

  get schoolLabel(): string {
    const selected = this.department.filter(d => d.selected).map(d => d.name);
    if (selected.length === 0) return '科系類別';
    if (selected.length <= 2) return selected.join('、');
    return `${selected[0]} 等 ${selected.length} 個學群`;
  }

  get typeLabel(): string {
    const selected = this.type.filter(d => d.selected).map(d => d.label);
    if (selected.length === 0) return '常見分類';
    if (selected.length <= 2) return selected.join('、');
    return `${selected[0]} 等 ${selected.length} 種分類`;
  }

  get activeFilters(): { key: string; label: string }[] {
    const tags: { key: string; label: string }[] = [];
    if (this.priceLabel     !== '價格區間') tags.push({ key: 'price',     label: this.priceLabel });
    if (this.conditionLabel !== '物況')     tags.push({ key: 'condition', label: this.conditionLabel });
    if (this.gradeLabel     !== '賣家評價') tags.push({ key: 'grade',     label: this.gradeLabel });
    if (this.locationLabel  !== '地區')     tags.push({ key: 'location',  label: this.locationLabel });
    if (this.schoolLabel    !== '科系類別') tags.push({ key: 'school',    label: this.schoolLabel });
    if (this.typeLabel      !== '常見分類') tags.push({ key: 'type',      label: this.typeLabel });
    return tags;
  }

  removeFilter(key: string): void {
    if (key === 'price') {
      this.priceValue     = this.DEFAULT_FILTERS.priceValue;
      this.priceHighValue = this.DEFAULT_FILTERS.priceHighValue;
    }
    if (key === 'condition') this.condition.forEach(c => c.selected = false);
    if (key === 'grade')     this.sellerGrade = this.DEFAULT_FILTERS.sellerGrade;
    if (key === 'location')  this.cities.forEach(c => c.selected = false);
    if (key === 'school')    this.department.forEach(d => d.selected = false);
    if (key === 'type')      this.type.forEach(t => t.selected = false);
    this.updatePagination();
  }

  // ── 重設 ───────────────────────────────────────────────
  resetFilters(): void {
    this.priceValue     = this.DEFAULT_FILTERS.priceValue;
    this.priceHighValue = this.DEFAULT_FILTERS.priceHighValue;
    this.sellerGrade    = this.DEFAULT_FILTERS.sellerGrade;
    this.cities.forEach(c => c.selected = false);
    this.department.forEach(d => d.selected = false);
    this.type.forEach(t => t.selected = false);
    this.condition.forEach(c => c.selected = false);
    this.pagination.goToPage(1);
  }

  resetQuery(): void {
    this.searchReq = {};
  }
}
