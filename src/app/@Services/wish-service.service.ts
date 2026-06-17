import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Wish {
  id: number;
  userId: number;
  title: string;
  description: string;
  // type: string[];
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

@Injectable({
  providedIn: 'root'
})
export class WishServiceService {
  private readonly BASE = 'http://localhost:8080/wish';
  constructor(private http:HttpClient) { }

  getWishesBySchool(school: string): Observable<any> {
    const params = new HttpParams()
      .set('school', school);

     return this.http
      .get<any>(`${this.BASE}/query/school`, {params})
  }
}
