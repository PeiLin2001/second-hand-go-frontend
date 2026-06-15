import { ChangeDetectorRef, Component, EventEmitter, Output, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UserService } from '../../../@Services/user.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  @Output() switchToRegister = new EventEmitter<{ step?: number, email?: string }>();

  hideLoginPassword = signal(true);
  userInputLogin = '';
  loginForm!: FormGroup;

  constructor(
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu\.tw$/)
      ]),
      password: new FormControl('', [Validators.required]),
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.userService.login(this.loginForm.value).subscribe({
        next: (res) => {
          if (res.role === 'user') {
            this.userService.isLoggedIn.set(true);
            sessionStorage.setItem('isLoggedIn', 'true');
            // 登入成功後立刻撈自己的資料
            this.userService.getMyInfo().subscribe({
              next: (info) => {
                if (info && info.user) {
                  this.userService.currentUser.set(info.user);
                  this.userService.updateAvatar(info.user.imgPath);
                }
              },
            });
            this.router.navigate(['/home']);
          } else if (res.role === 'manager') {
            this.router.navigate(['/report']);
          }
        },
        error: (err) => {
          this.loginForm.markAllAsTouched();
          const status = err?.statusCode;

          if (status === 400) {
            Swal.fire({
              title: '登入失敗',
              text: '帳號或密碼錯誤',
              icon: 'error',
              confirmButtonColor: '#e57373'
            });

          } else if (err.message === 'Please verify' || err.message === 'Verification is invalid') {
            const email = this.loginForm.get('email')?.value;

            Swal.fire({
              title: '尚未驗證或驗證已過期',
              text: '正在發送驗證信，請稍候...',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();

                this.userService.resendCode(email).subscribe({
                  next: () => {
                    Swal.close();
                    this.switchToRegister.emit({ step: 2, email });
                    this.cdr.detectChanges();
                  },
                  error: () => {
                    Swal.fire({
                      title: '驗證信發送失敗',
                      text: '請稍後再試',
                      icon: 'error',
                      confirmButtonColor: '#e57373'
                    });
                  }
                });
              }
            });

          } else {
            Swal.fire({
              title: '連線錯誤',
              text: '請稍後再試',
              icon: 'error',
              confirmButtonColor: '#e57373'
            });
          }
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
