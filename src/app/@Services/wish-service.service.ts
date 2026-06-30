import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Wish {
  id: number;
  userId: number;
  title: string;
  description: string;
  location: string[];
  budgetMin: number;
  budgetMax: number;
  status: string;
  createdAt: string;
  expiredAt: string;
  wisher: Wisher;
}

export interface Wisher {
  userId: number;
  userName: string;
  school: string;
  userImgPath: string;
  department: string;
  goodLevel: number;
}

export interface WishForm {
  title: string;
  description: string;
  location: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  expiredAt: string;
  status: string;
}

export interface WishReq {
  title: string;
  description: string;
  location: string[];
  budgetMin: number;
  budgetMax: number;
  status: string;
}

export interface ApiResponse<T = unknown> {
  statusCode?: number;
  message?: string;
  data?: T;
}

export interface WishListRes extends ApiResponse {
  wishesList: Wish[];
}

export interface WishInsertData {
  id?: number;
}

export type WishInsertRes = ApiResponse<WishInsertData>;

@Injectable({
  providedIn: 'root',
})
export class WishServiceService {
  private readonly BASE_URL = `${environment.apiUrl}/wish`;

  constructor(private http: HttpClient) {}

  getWishesBySchool(school: string): Observable<WishListRes> {
    const params = new HttpParams().set('school', school);

    return this.http.get<WishListRes>(`${this.BASE_URL}/query/school`, {
      params,
      withCredentials: true,
    });
  }

  getAllWishes(): Observable<WishListRes> {
    return this.http.get<WishListRes>(`${this.BASE_URL}/query/all`, {
      withCredentials: true,
    });
  }

  addWish(wishReq: WishReq, userId: number): Observable<WishInsertRes> {
    const params = new HttpParams().set('userId', String(userId));

    return this.http.post<WishInsertRes>(`${this.BASE_URL}/insert`, wishReq, {
      params,
      withCredentials: true,
    });
  }
}
