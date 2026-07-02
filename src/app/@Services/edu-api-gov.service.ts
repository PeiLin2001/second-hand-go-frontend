import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EduApiGovService {
  // private url = `${environment.moeApiUrl}/files/opendata/u1_new.json`;
  private url = `${environment.apiUrl}/edu/schools`;
  private schools$: Observable<any[]> | null = null;

  constructor(private http: HttpClient) {}

  getSchools(): Observable<any[]> {
    return this.http.get<any[]>(this.url);
  }
}
