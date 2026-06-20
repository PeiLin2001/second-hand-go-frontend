import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

// 定義表單資料的介面結構
export interface ProductState {
  catMain: string[];
  condition: string;
  price: number;
  tags: string[];
  name: string; // 步驟二的商品名稱（AI 套用會寫入這裡）
  desc: string; // 步驟二的商品描述
  locationRegions: string[],
  grades: string[],
  imageSlotUrls: string[],
  deptGroup: string[],
  productId: number;
}

export interface DraftItem {
  id: string;  // 唯一識別碼
  savedAt: string; // 儲存時間（ISO string）
  state: ProductState;
}

@Injectable({ providedIn: 'root' })
export class LaunchProductFormService {

  //草稿
  private productApiUrl = 'http://localhost:8080/product';

  state: ProductState = this.emptyState();
  isUpdate = signal<boolean>(false);
  setUpdateStatus(value: boolean) {
    this.isUpdate.set(value);
  }

  currentDraftId: string | null = null; // 記錄當前編輯的草稿 id

  private emptyState(): ProductState {
    return {
      productId: 0,
      catMain: [], // 分類
      condition: '', // 商品狀況
      price: 0,
      tags: [], //
      name: '', // 商品名稱
      desc: '', // 商品描述
      locationRegions: [], // 地區
      grades: [], // 年級
      imageSlotUrls: new Array(7).fill('') as string[], // 圖片
      deptGroup: [], // 學群
    };
  }

  constructor(private http: HttpClient) { }

  // ── 共用：組 request body，欄位名稱對齊後端 ProductReq ── (新增)
  // private buildRequestBody() {
  //   return {
  //     productName: this.state.name,
  //     description: this.state.desc,
  //     price: this.state.price,
  //     productCondition: this.state.condition,
  //     type: this.state.catMain,
  //     location: this.state.locationRegions,
  //     grade: this.state.grades,
  //     imgList: this.state.imageSlotUrls.filter(u => u !== ''),
  //   };
  // }

  // //async：非同步
  // // ── 草稿：存（新增 or 覆蓋）── (改)
  // async saveDraft(): Promise<any> {
  //   const body = this.buildRequestBody();

  //   if (this.currentDraftId) {
  //     const res = await fetch(`${this.productApiUrl}/draft/${this.currentDraftId}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       credentials: 'include',
  //       body: JSON.stringify(body),
  //     });
  //     return res.json();
  //   } else {
  //     // 新增草稿（userId 從後端 session 取，不用前端傳）
  //     const res = await fetch(`${this.productApiUrl}/draft`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       credentials: 'include',
  //       body: JSON.stringify(body),
  //     });
  //     const data = await res.json();
  //     this.currentDraftId = String(data.productId);
  //     return data;
  //   }
  // }

  // // ── 草稿：取得清單 ──
  // async getDrafts(userId: number): Promise<DraftItem[]> {
  //   const res = await fetch(`${this.productApiUrl}/user/${userId}/drafts`);
  //   const data = await res.json();
  //   // 後端回傳格式轉成前端 DraftItem 格式
  //   return data.map((item: any) => ({
  //     id: String(item.id),
  //     savedAt: item.savedAt,
  //     state: {
  //       name: item.name,
  //       desc: item.description,
  //       price: item.price,
  //       condition: item.condition,
  //       catMain: item.categories ?? [],
  //       locationRegions: item.locationRegions ?? [],
  //       grades: item.grades ?? [],
  //       imageSlotUrls: item.imageSlotUrls ?? new Array(7).fill(''),
  //       tags: [],
  //     },
  //   }));
  // }

  // // ── 草稿：載入到 state（繼續編輯用）──
  // loadDraft(draft: DraftItem): void {
  //   this.state = JSON.parse(JSON.stringify(draft.state));
  //   this.currentDraftId = draft.id;
  // }

  // // ── 草稿：刪除 ──
  // async deleteDraft(id: string): Promise<void> {
  //   await fetch(`${this.productApiUrl}/${id}`, {
  //     method: 'DELETE',
  //     credentials: 'include'
  //   });
  // }

  // ── 上架 ──
  // async publishProduct(): Promise<any> {
  //   // 如果沒有草稿 id ，就先存一筆草稿
  //   if (!this.currentDraftId) {
  //     await this.saveDraft();
  //   }
  //   const res = await fetch(`${this.productApiUrl}/${this.currentDraftId}/publish`, {
  //     method: 'PUT',
  //     credentials: 'include',
  //   });
  //   return res.json();
  // }

  // // ── 下架 ──
  // async unpublishProduct(id: string): Promise<void> {
  //   await fetch(`${this.productApiUrl}/${id}/unpublish`, {
  //     method: 'PUT',
  //     credentials: 'include',
  //   });
  // }

  // // ── 已上架商品清單 ──
  // async getPublished(userId: number): Promise<any[]> {
  //   const res = await fetch(`${this.productApiUrl}/user/${userId}/published`, {
  //     credentials: 'include',
  //   });
  //   const data = await res.json();

  //   return (data.productList ?? []).map((item: any) => ({
  //     id: String(item.productId),
  //     name: item.productName ?? '',
  //     price: item.price ?? 0,
  //     image: item.imgPath?.[0] ?? '',
  //     category: item.type?.[0] ?? '',
  //   }));
  // }

  // ── 重置 ──
  resetState(): void {
    this.state = this.emptyState();
    this.currentDraftId = null;
  }

  // ========== 絲絨改動 ==========

  // 新增
  addProduct(req: any): Observable<any> {
    return this.http.post(`${this.productApiUrl}/add`, req, { withCredentials: true });
  }

  // 更新
  updateProduct(req: any): Observable<any> {
    return this.http.post(`${this.productApiUrl}/update`, req, { withCredentials: true });
  }

  // 發布
  publishProduct(productId: number): Observable<any> {
    return this.http.post(`${this.productApiUrl}/publish?productId=${productId}`, {}, { withCredentials: true });
  }

  // 下架
  unpublishById(productId: number): Observable<any> {
    return this.http.post(`${this.productApiUrl}/unpublish?productId=${productId}`, {});
  }

  // 刪除
  deleteById(productId: number): Observable<any> {
    return this.http.post(`${this.productApiUrl}/delete?productId=${productId}`, {});
  }

  // 取得清單
  searchBySellerId(userId: number): Observable<any> {
    return this.http.get(`${this.productApiUrl}/search/userId?userId=${userId}`);
  }

  //商品頁:單一商品詳情
  searchByProductId(productId: number): Observable<any> {
    return this.http.get(`${this.productApiUrl}/search/productId?productId=${productId}`);
  }

  // ── 撈資料：後端格式 → 表單暫存格式 ──
  fromProductRes(res: ProductRes): ProductState {
    const slots = new Array(7).fill('') as string[];
    res.imgPath.forEach((url, i) => {
      if (i < 7) slots[i] = url;
    });

    const newState: ProductState = {
      catMain: res.type ?? [],
      condition: res.productCondition ?? '',
      price: res.price ?? 0,
      tags: [],
      name: res.productName ?? '',
      desc: res.description ?? '',
      locationRegions: res.location ?? [],
      grades: res.grade ?? [],
      imageSlotUrls: slots,
      deptGroup: res.deptGroup ?? [],
      productId: res.productId ?? 0,
    };

    this.state = newState;
    this.currentDraftId = String(res.productId);

    return newState;
  }

  // ── 送出：表單暫存格式 → 後端格式 ──
  toProductReq(state: ProductState, productId: number = 0, status?: string): ProductReq {
    return {
      productId: state.productId,
      productName: state.name,
      description: state.desc,
      price: state.price,
      imgList: state.imageSlotUrls.filter(url => url !== ''),
      type: state.catMain,
      productCondition: state.condition,
      grade: state.grades,
      location: state.locationRegions,
      deptGroup: state.deptGroup,
      ...(status ? { status } : {}),
    };
  }

}


// ── 後端 searchByProductId 回傳的單筆商品資料形狀 ──
// 對應 console 實際看到的 productList[0] 結構
export interface ProductRes {
  productId: number;
  userId: number;
  productName: string;
  description: string;
  price: number;
  imgPath: string[];
  type: string[];
  productCondition: string;
  grade: string[];
  location: string[];
  deptGroup: string[];
  status: string;
  shelfDate: string;
  seller?: {
    userId: number;
    userName: string;
    school: string;
    userImgPath: string;
    department: string;
  };
}

// ── 送出給後端的格式（對應 ProductReq）──
export interface ProductReq {
  productId: number;
  productName: string;
  description: string;
  price: number;
  imgList: string[];
  type: string[];
  productCondition: string;
  grade: string[];
  location: string[];
  deptGroup: string[];
  status?: string;
}

