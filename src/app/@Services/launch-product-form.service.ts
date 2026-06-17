import { Injectable } from '@angular/core';

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
  imageSlotUrls:string[],
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

  currentDraftId: string | null = null; // 記錄當前編輯的草稿 id

  private emptyState(): ProductState {
  return {
    catMain: [],
    condition: '',
    price: 0,
    tags: [],
    name: '',
    desc: '',
    locationRegions: [],
    grades: [],
    imageSlotUrls: new Array(7).fill('') as string[],
  };
}

  constructor() {}

  // ── 共用：組 request body，欄位名稱對齊後端 ProductReq ── (新增)
  private buildRequestBody() {
    return {
      productName: this.state.name,
      description: this.state.desc,
      price: this.state.price,
      productCondition: this.state.condition,
      type: this.state.catMain,
      location: this.state.locationRegions,
      grade: this.state.grades,
      imgList: this.state.imageSlotUrls.filter(u => u !== ''),
    };
  }

  //async：非同步
  // ── 草稿：存（新增 or 覆蓋）── (改)
  async saveDraft(): Promise<any> {
    const body = this.buildRequestBody();

    if (this.currentDraftId) {
      const res = await fetch(`${this.productApiUrl}/draft/${this.currentDraftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      return res.json();
    } else {
      // 新增草稿（userId 從後端 session 取，不用前端傳）
      const res = await fetch(`${this.productApiUrl}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      this.currentDraftId = String(data.productId);
      return data;
    }
  }

  // ── 草稿：取得清單 ──
  async getDrafts(userId: number): Promise<DraftItem[]> {
    const res = await fetch(`${this.productApiUrl}/user/${userId}/drafts`);
    const data = await res.json();
    // 後端回傳格式轉成前端 DraftItem 格式
    return data.map((item: any) => ({
      id: String(item.id),
      savedAt: item.savedAt,
      state: {
        name: item.name,
        desc: item.description,
        price: item.price,
        condition: item.condition,
        catMain: item.categories ?? [],
        locationRegions: item.locationRegions ?? [],
        grades: item.grades ?? [],
        imageSlotUrls: item.imageSlotUrls ?? new Array(7).fill(''),
        tags: [],
      },
    }));
  }

  // ── 草稿：載入到 state（繼續編輯用）──
  loadDraft(draft: DraftItem): void {
    this.state = JSON.parse(JSON.stringify(draft.state));
    this.currentDraftId = draft.id;
  }

  // ── 草稿：刪除 ──
  async deleteDraft(id: string): Promise<void> {
    await fetch(`${this.productApiUrl}/${id}`, {
      method: 'DELETE' ,
      credentials: 'include'});
  }

  // ── 上架 ──
  async publishProduct(): Promise<any> {
    // 如果沒有草稿 id ，就先存一筆草稿
    if (!this.currentDraftId) {
      await this.saveDraft();
    }
    const res = await fetch(`${this.productApiUrl}/${this.currentDraftId}/publish`, {
      method: 'PUT',
      credentials: 'include',
    });
    return res.json();
  }

  // ── 下架 ──
  async unpublishProduct(id: string): Promise<void> {
    await fetch(`${this.productApiUrl}/${id}/unpublish`, {
      method: 'PUT',
      credentials: 'include',});
  }

  // ── 已上架商品清單 ──
  async getPublished(userId: number): Promise<any[]> {
    const res = await fetch(`${this.productApiUrl}/user/${userId}/published`, {
      credentials: 'include',
    });
    const data = await res.json();

    return (data.productList ?? []).map((item: any) => ({
      id: String(item.productId),
      name: item.productName ?? '',
      price: item.price ?? 0,
      image: item.imgPath?.[0] ?? '',
      category: item.type?.[0] ?? '',
    }));
  }

  // ── 重置 ──
  resetState(): void {
    this.state = this.emptyState();
    this.currentDraftId = null;
  }

}




