import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { map, Observable, tap } from 'rxjs';
import { BasicResponse, ChangePasswordVo, SetInfoVo, User, UserReq, UserRes } from '../@Interface/user';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface LoginReq {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  //預設頭像
  avatarUrl = signal<string>('https://res.cloudinary.com/df8kviidh/image/upload/v1780243053/default_avatar_lvgh1a.png');
  private myProxyUrl = '/user';

  private apiUrl = `${environment.apiUrl}/user`;
  isLoggedIn = signal<boolean>(sessionStorage.getItem('isLoggedIn') === 'true'); // Demo 暫用

  // 存使用者資料的 Signal by.絲絨
  currentUser = signal<any>(null);

  constructor(private http: HttpClient, private router: Router,) { }

  // 登入 by.絲絨
  login(data: LoginReq): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data, { withCredentials: true }).pipe(
      map((res: any) => {
        //  只要不是 200，就直接 Throw Error！
        if (!res || res.statusCode !== 200) { throw res; }
        return res;
      })
    );
  }

  // 取得使用者資料 by.絲絨
  getUserData(userId: number): Observable<any> {
    // 目前 Demo 階段：把 ID 帶在網址後面傳給後端
    return this.http.get(`${this.apiUrl}/getByUserId?userId=${userId}`);
  }

  // 取得自己的資料（從 session）
  getMyInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getMyInfo`, { withCredentials: true });
  }

  // 登出
  logout() {
    return this.http.post(`${this.apiUrl}/logOut`, {}, { withCredentials: true })
      .pipe(tap(() => {
        this.isLoggedIn.set(false);
        this.currentUser.set(null);
        sessionStorage.clear();
      }));
  }

  /** 頭像同步變更廣播
   * 使用方法
   * TS 注入: constructor(public userService: UserService) {}
   * HTML 綁定: <img [src]="userService.avatarUrl()" alt="使用者大頭貼">
   */
  updateAvatar(newUrl: string) {
    this.avatarUrl.set(newUrl);
  }

  updateCurrentUser(partial: Partial<any>) {
  this.currentUser.update(user => user ? { ...user, ...partial } : user);
  }

  //註冊
  register(data: UserReq): Observable<BasicResponse> {
    return this.http.post<BasicResponse>(`${this.apiUrl}/insert`, data, {
      withCredentials: true
    });
  }

  //使用者輸入驗證碼後按下發送所需要街的資料回傳API(初次及後續驗證皆是這個)
  verifyEmail(payload: { email: string; code: string }): Observable<BasicResponse> {
    return this.http.post<BasicResponse>(`${this.apiUrl}/verify`, payload);
  }

  //重新發送驗證碼
  resendCode(email: string): Observable<BasicResponse> {
    return this.http.post<BasicResponse>(`${this.apiUrl}/resend`, { user_id: email });
  }


  //修改個人資料
  updateProfile(vo: SetInfoVo): Observable<BasicResponse> {
    return this.http.post<BasicResponse>(`${this.apiUrl}/setInfo`, vo, {
      withCredentials: true
    });
  }

  //修改密碼
  public changePassword(pwdData: ChangePasswordVo) {
    return this.http.post<BasicResponse>(`${this.apiUrl}/changePassword`, pwdData, { withCredentials: true });
  }

  // 取得各校成員
  getUserDataBySchool(school: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getClassmate?school=${school}`);
  }

  // 取得地區成員
  getUserDataByLocation(location : string):Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getTheNearBy?location=${location}`);
  }

  // 取得所有使用者
  getAllUser():Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getUsers`);
  }

}
