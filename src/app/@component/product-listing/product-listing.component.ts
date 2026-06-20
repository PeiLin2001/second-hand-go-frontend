import { EduApiGovService } from './../../@Services/edu-api-gov.service';
import { GetProductDataRes, ProductServiceService } from './../../@Services/product-service.service';
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Options } from '@angular-slider/ngx-slider';
import { FormsModule } from '@angular/forms';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaginationService } from '../../@Services/pageination.service';

// 素材庫
import { LucideAngularModule, Home, ChevronRight, ChevronLeft, RotateCcw, X } from 'lucide-angular';
import { UiBehaviorService } from '../../@Services/ui-behavior.service';
import { ProductCardComponent } from '../product-card/product-card.component';
import { EighteenAcademyService } from '../../@Services/eighteen-academy.service';
import { ProductCard } from '../../@Interface/product-card';
import { CategoriesService } from '../../@Services/categories.service';
import { SearchProductReq } from '../../@Services/product-service.service';
import { combineLatest, Observable } from 'rxjs';

// 網址用的 slug → type 中文名稱
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

@Component({
  selector: 'app-product-listing',
  imports: [LucideAngularModule, RouterLink, FormsModule, NgxSliderModule, ProductCardComponent],
  templateUrl: './product-listing.component.html',
  styleUrl: './product-listing.component.scss'
})
export class ProductListingComponent implements OnInit, OnDestroy {


  // =========================================================
  // ICONS
  // =========================================================

  protected readonly HomeIcon     = Home;
  readonly nextIcon     = ChevronRight;
  readonly prevIcon     = ChevronLeft;
  readonly RotateCcwIcon = RotateCcw;
  readonly XIcon        = X;

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected uiBehavior: UiBehaviorService,
    protected aca: EighteenAcademyService,
    public pagination: PaginationService,
    protected productservice:ProductServiceService,
    protected ctgService:CategoriesService,
    protected eduApiGovService:EduApiGovService
  ) {}

  // =========================================================
  // LIFECYCLE
  // =========================================================

  ngOnInit(): void {
      combineLatest([
        this.route.paramMap,
        this.route.queryParamMap
      ]).subscribe(([params, query]) => {

        window.scrollTo({ top: 0, behavior: 'instant' });

        // category
        this.category = params.get('category') || 'all';

        // filter
        const filterJson = query.get('filter');

        if (filterJson) {
          try {
            this.searchReq = JSON.parse(filterJson);
          } catch {
            this.searchReq = {};
          }
        } else {
          this.searchReq = {};
        }

        // department
        const deptsParam = query.get('depts');
        const selectedNames = deptsParam?.split(',') ?? [];

        this.department.forEach(d => {
          d.selected = selectedNames.includes(d.name);
        });

        this.loadProducts();
      });
  }

  ngOnDestroy(): void {
    this.resetFilters();
    this.goToPage(1);
    this.resetQuery();
  }

  // =========================================================
  // LOADING AND RESET
  // =========================================================

  products: ProductCard[] = [];
  isLoading = false;

  loadProducts(){
    this.isLoading = true;

    const hasSearch =
    Object.keys(this.searchReq).length > 0;
    // this.keyword ||

    console.log('hasSearch=', hasSearch);

    if (hasSearch) {
      this.loadSearchProducts();
      return;
    }
    else if (this.category && this.category !== 'all')
    {
      this.loadCategoryProducts();
      return;
    }
    else
    {
      this.loadAllProducts();
      return;
    }
  }

  private loadSearchProducts() {
    console.log('走 search API');

    this.handleProductResponse(
      this.productservice.search(this.searchReq)
    );
  }

  private loadCategoryProducts() {
    const chineseCat = CATEGORY_MAP[this.category!] ?? this.category;

    this.handleProductResponse(
      this.productservice.searchByType(chineseCat)
    );
  }

  private loadAllProducts() {
    this.handleProductResponse(
      this.productservice.getAll()
    );
  }

  protected handleProductResponse(
    observable: Observable<GetProductDataRes>
  )
  {
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


  resetQuery(){
    this.searchReq = {};
  }




  // =========================================================
  // 偷 sidenav 的 code 來用
  // =========================================================

  // 宣告商品種類
  get categories():any[]{
    return this.ctgService.categories
  }

  // 被選擇的商品種類
  selectedCategory = '';

  // 以常見分類選擇商品
  selectCategory(value: string){
    this.selectedCategory = value;
    this.goToProductList();
  }

  goToProductList(){
    this.router.navigate(['/product-list', this.selectedCategory]);
  }

  // =========================================================
  // CATEGORY
  // =========================================================

  searchReq: SearchProductReq = {};
  allProducts:ProductCard[] = [];

  category: string | null = '';

  get categoryName(): string {

    if (this.searchReq.keyword) {
      return '搜尋結果';
    }

    if (this.category === 'all') {
      return '全部商品';
    }

    return CATEGORY_MAP[this.category!] || '全部商品';
  }

  // =========================================================
  // PANEL OPEN / CLOSE
  // =========================================================

  panelState = {
    sort:     false,
    filter:   false,
  };

  togglePanel(event: Event, panel: keyof typeof this.panelState) {
    this.uiBehavior.togglePanel(event, this.panelState, panel);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.uiBehavior.closeAll(this.panelState);
  }

  // =========================================================
  // PRICE FILTER
  // =========================================================

  private readonly DEFAULT_FILTERS = {
    priceValue:     0,
    priceHighValue: 5000,
    sellerGrade:    1,
    sellerHighestGrade:    5,
    condition: "",
    type: "",
  } as const;

  priceValue     = this.DEFAULT_FILTERS.priceValue;
  priceHighValue = this.DEFAULT_FILTERS.priceHighValue;

  scoreValue = this.DEFAULT_FILTERS.sellerGrade;
  scoreHighValue = this.DEFAULT_FILTERS. sellerHighestGrade;

  priceOptions: Options = {
    floor: 0,
    ceil: 5000,
    step: 200,
    translate: (value: number): string => {
      if (value >= 5000) return '$5,000+';
      return `$${value.toLocaleString()}`;
    }
  };

  // =========================================================
  // SELLER RATING FILTER
  // =========================================================

  sellerGrade = this.DEFAULT_FILTERS.sellerGrade;

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

  // =========================================================
  // FILTER CHANGE HANDLERS
  // =========================================================

  onCityChange() {
    this.pagination.goToPage(1);
    this.updatePagination();
  }

  onDeptChange() {
    this.pagination.goToPage(1);
    this.updatePagination();
  }

  // =========================================================
  // FILTER LABEL GETTERS
  // =========================================================

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

  // =========================================================
  // ACTIVE FILTER TAGS
  // =========================================================

  get activeFilters(): { key: string; label: string }[] {
    const tags: { key: string; label: string }[] = [];
    if (this.priceLabel       !== '價格區間') tags.push({ key: 'price',    label: this.priceLabel });
    if (this.conditionLabel   !== '物況') tags.push({ key: 'condition',    label: this.conditionLabel });
    if (this.gradeLabel       !== '賣家評價') tags.push({ key: 'grade',    label: this.gradeLabel });
    if (this.locationLabel    !== '地區')     tags.push({ key: 'location', label: this.locationLabel });
    if (this.schoolLabel      !== '科系類別') tags.push({ key: 'school',   label: this.schoolLabel });
    if (this.typeLabel        !== '常見分類') tags.push({ key: 'type',   label: this.typeLabel });
    return tags;
  }



  removeFilter(key: string): void {
    if (key === 'price') {
      this.priceValue     = this.DEFAULT_FILTERS.priceValue;
      this.priceHighValue = this.DEFAULT_FILTERS.priceHighValue;
    }
    if (key === 'condition') this.condition.forEach(c => c.selected = false);
    if (key === 'grade')    this.sellerGrade = this.DEFAULT_FILTERS.sellerGrade;
    if (key === 'location') this.cities.forEach(c => c.selected = false);
    if (key === 'school')   this.department.forEach(d => d.selected = false);
  }


// =========================================================
// SORT
// =========================================================

sortOption: 'newest' | 'price-asc' | 'price-desc' = 'newest';

setSort(option: typeof this.sortOption, event: Event): void {
  event.stopPropagation();
  this.sortOption = option;
  this.panelState.sort = false;
  this.pagination.goToPage(1);
}

get sortLabel(): string {
  const map = {
    'newest':     '最新上架',
    'price-asc':  '價格由低到高',
    'price-desc': '價格由高到低',
  };
  return map[this.sortOption];
}

get sortedProducts(): ProductCard[] {
  const list = [...this.filteredProducts];
  switch (this.sortOption) {
    case 'price-asc':  return list.sort((a, b) => a.price - b.price);
    case 'price-desc': return list.sort((a, b) => b.price - a.price);
    case 'newest':
    default:           return list; // 假設原始資料已是最新排序
  }
}

  // =========================================================
  // PAGINATION（每頁最多 30 筆）
  // =========================================================

  pageSize = 30;

  get pagedProducts(): ProductCard[] {
    const start = (this.pagination.currentPage - 1) * this.pageSize;
    return this.sortedProducts.slice(start, start + this.pageSize);
  }

  updatePagination(): void {
    this.pagination.init(
      this.filteredProducts.length,
      this.pageSize
    );
  }

  prevPage()              { this.pagination.prevPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  nextPage()              { this.pagination.nextPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  goToPage(page: number)  { this.pagination.goToPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  // =========================================================
  // RESET
  // =========================================================

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

  // 清除篩選
  clearAllFilters(event: Event): void {
    event.stopPropagation();
    this.resetFilters();
    this.resetQuery();
    this.router.navigate(['/product-list/all'])
  }


  // =========================================================
  // 前端篩選結果
  // =========================================================

  protected matchCategory(product: ProductCard): boolean {
    const chineseCat = CATEGORY_MAP[this.category!];

    return (
      !this.searchReq.keyword &&
      this.category !== 'all'
        ? product.type.includes(chineseCat)
        : true
    );

  }

  protected matchPrice(product: ProductCard): boolean {
    if (this.priceHighValue >= 5000) {
      return product.price >= this.priceValue;  // 上限拉滿就不限上限
    }
    return (
      product.price >= this.priceValue &&
      product.price <= this.priceHighValue
    );
  }

  protected matchCity(product: ProductCard): boolean {
    const selectedCity = this.cities
      .filter(c => c.selected)
      .map(c => c.name);

    return (
      selectedCity.length === 0 ||
      selectedCity.some(city => product.location.includes(city))
    );
  }

  protected matchSchool(product: ProductCard): boolean {
    const selectedSchool = this.department
      .filter(d => d.selected)
      .map(d => d.name);

    return (
      selectedSchool.length === 0 ||
      selectedSchool.some(s => product.deptGroup.includes(s))
    );
  }

  protected matchType(product: ProductCard): boolean {
    const selectedTypes = this.type
      .filter(t => t.selected)
      .map(t => CATEGORY_MAP[t.value]);

    return (
      selectedTypes.length === 0 ||
      selectedTypes.some(t => product.type.includes(t))
    );
  }

  protected matchCondition(product: ProductCard): boolean {
    const selectedConditions = this.condition
      .filter(c => c.selected)
      .map(c => c.label);

    return (
      selectedConditions.length === 0 ||
      selectedConditions.includes(product.condition)
    );
  }

  // protected matchCredictScore(product: ProductCard): boolean{
  //   if (this.scoreHighValue >= 5) {
  //     return product.price >= this.priceValue;  // 上限拉滿就不限上限
  //   }
  //   return (
  //     product.price >= this.priceValue &&
  //     product.price <= this.priceHighValue
  //   );
  // }


  get filteredProducts(): ProductCard[] {
    return this.products.filter(product =>
      this.matchCategory(product) &&
      this.matchPrice(product) &&
      this.matchCity(product) &&
      this.matchSchool(product) &&
      this.matchType(product) &&
      this.matchCondition(product)
    );
  }


  // =========================================================
  // 假資料
  // =========================================================

  get type() : any[]{
    return this.ctgService.categories;
  }

  get condition() : any[]{
    return this.ctgService.conditions;
  }

  get department(): any[]{
    return this.aca.academy
  }

  get cities(): any[]{
    return this.ctgService.cities;
  }



}
