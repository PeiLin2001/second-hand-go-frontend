import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { Router } from '@angular/router';

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

  // ── 草稿：存（新增 or 覆蓋）──
  async saveDraft(userId: number): Promise<DraftItem> {
    const body = this.buildRequestBody('DRAFT');

    if (this.currentDraftId) {
      const res = await fetch(`${this.productApiUrl}/draft/${this.currentDraftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.json();
    } else {
      const res = await fetch(`${this.productApiUrl}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, userId }),
      });
      const data = await res.json();
      this.currentDraftId = String(data.id);
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
    await fetch(`${this.productApiUrl}/${id}`, { method: 'DELETE' });
  }

  // ── 上架 ──
  async publishProduct(userId: number): Promise<any> {
    // 如果還沒有草稿 id，先建一筆草稿再上架
    if (!this.currentDraftId) {
      await this.saveDraft(userId);
    }
    const res = await fetch(`${this.productApiUrl}/${this.currentDraftId}/publish`, {
      method: 'PUT',
    });
    return res.json();
  }

  // ── 下架 ──
  async unpublishProduct(id: string): Promise<void> {
    await fetch(`${this.productApiUrl}/${id}/unpublish`, { method: 'PUT' });
  }

  // ── 已上架商品清單 ──
  async getPublished(userId: number): Promise<any[]> {
    const res = await fetch(`${this.productApiUrl}/user/${userId}/published`);
    return res.json();
  }

  // ── 重置 ──
  resetState(): void {
    this.state = this.emptyState();
    this.currentDraftId = null;
  }

  // ── 共用：組 request body ──
  private buildRequestBody(status: 'DRAFT' | 'PUBLISHED') {
    return {
      name: this.state.name,
      description: this.state.desc,
      price: this.state.price,
      condition: this.state.condition,
      status,
      categories: this.state.catMain,
      locationRegions: this.state.locationRegions,
      grades: this.state.grades,
      imageSlotUrls: this.state.imageSlotUrls,
    };
  }

}




