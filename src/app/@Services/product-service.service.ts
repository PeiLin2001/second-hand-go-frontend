import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ProductCard } from '../@Interface/product-card';
import { map, Observable } from 'rxjs';


// 對應後端 SearchProductReq
export interface SearchProductReq {
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  types?: string[];
  conditions?: string[];
  grades?: string[];
  deptGroups?: string[];
}

// 對應後端 GetProductDataRes（你要確認後端實際欄位名稱）
export interface GetProductDataRes {
  statusCode:number,
  message:string,
  productList: ProductCard[];
}


@Injectable({
  providedIn: 'root'
})
export class ProductServiceService {

  private readonly BASE = 'http://localhost:8080/product';

  constructor(private http:HttpClient) { }

  search(req: SearchProductReq): Observable<GetProductDataRes> {
    return this.http
      .post<any>(`${this.BASE}/search`, req)
      .pipe(map(res => this.mapResponse(res)));
  }

  getAll(): Observable<GetProductDataRes> {
    return this.http
      .get<any>(`${this.BASE}/getInfo`)
      .pipe(map(res => this.mapResponse(res)));
  }

  searchByType(type: string): Observable<GetProductDataRes> {

    const params = new HttpParams()
      .set('type', type);

    return this.http
      .get<any>(`${this.BASE}/search/type`, { params })
      .pipe(map(res => this.mapResponse(res)));
  }

  getByUniversity(university:string): Observable<GetProductDataRes> {
    const params = new HttpParams()
      .set('school',university);

    return this.http
      .get<any>(`${this.BASE}/search/school`, { params })
      .pipe(map(res => this.mapResponse(res)));
  }

  private mapProduct(p: any): ProductCard {
    return {
      productId: p.productId,
      userId: p.userId,

      title: p.productName || '未命名商品',

      description: p.description,

      price: p.price || 0,

      type: p.type || [],

      time: p.shelfDate || '',

      condition: p.productCondition || '未知',

      imgUrl:
        p.imgPath?.[0] ??
        'https://www.townlinepaint.com/cdn/shop/products/B6B4B2.png?v=1646778952&width=1200/default.jpg',

      status: p.status,

      grade: p.grade,

      location: p.location || '未知地點',

      deptGroup: p.deptGroup,

      user: {
        userName: p.seller?.userName || `幽靈同學${p.userId}號`,
        userImg:
        p.seller?.userImgPath ??
        'https://www.townlinepaint.com/cdn/shop/products/B6B4B2.png?v=1646778952&width=1200/default.jpg',
        university: p.seller?.school || '吉利開心大學',
        department: p.seller?.department || '未設定系所',
        goodLevel: p.seller?.goodLevel || '尚未有評分'
      }
    };
  }

  private mapResponse(res: any): GetProductDataRes {
    return {
      statusCode: res?.statusCode ?? 418,

      message: res?.message ?? 'ㄐ哥踩到狗屎ㄏㄏ',

      productList: (res?.productList ?? []).map((p: any) =>
        this.mapProduct(p)
      )
    };
  }
}
