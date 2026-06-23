import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { Observable, startWith, map } from 'rxjs';
import Swal from 'sweetalert2';
import { UserReq, BasicResponse } from '../../../@Interface/user';
import { SchoolDataService } from '../../../@Services/school-data.service';
import { UserService } from '../../../@Services/user.service';
import { PlatformRulesComponent } from '../../platform-rules/platform-rules.component';

export const SCHOOL_DOMAIN_MAP: Record<string, string> = {
  // 台北
  'ntu.edu.tw': '國立臺灣大學',
  'ntust.edu.tw': '國立臺灣科技大學',
  'ntnu.edu.tw': '國立臺灣師範大學',
  'tku.edu.tw': '淡江大學',
  'fju.edu.tw': '輔仁大學',
  'scu.edu.tw': '東吳大學',
  'mcut.edu.tw': '明志科技大學',
  // 桃竹苗
  'nthu.edu.tw': '國立清華大學',
  'nctu.edu.tw': '國立陽明交通大學',
  'ncu.edu.tw': '國立中央大學',
  'cycu.edu.tw': '中原大學',
  // 台中
  'nchu.edu.tw': '國立中興大學',
  'thu.edu.tw': '東海大學',
  'fcu.edu.tw': '逢甲大學',
  // 台南
  'ncku.edu.tw': '國立成功大學',
  'tut.edu.tw' : '台南應用科技大學',
  // 高雄
  'nsysu.edu.tw': '國立中山大學',
  'nuk.edu.tw': '國立高雄大學',
  'nkust.edu.tw': '國立高雄科技大學',
};

export function getSchoolFromEmail(email: string): string | null {
  const domain = email.split('@')[1];
  if (!domain) return null;
  const matched = Object.keys(SCHOOL_DOMAIN_MAP).find(key => domain.endsWith(key));
  return matched ? SCHOOL_DOMAIN_MAP[matched] : null;
}

@Component({
  selector: 'app-register',
  imports: [   FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    AsyncPipe,],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
    @Output() switchToLogin = new EventEmitter<void>();
    // 新增兩個 Input 接收父層傳來的初始值
    @Input() initialStep = 1;
    @Input() initialEmail = '';

  currentStep = 1;
  userEmail = '';
  isEmailTouched = false;
  verificationCode = '';
  isCodeTouched = false;
  countdown = signal<number>(0);
  private timer: any;

  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  registerForm!: FormGroup;
  filteredAreas!: Observable<string[]>;
  filteredSchools!: Observable<string[]>;

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private schoolService: SchoolDataService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // 用 Input 的值來初始化，而不是寫死的 1
  this.currentStep = this.initialStep;
  if (this.initialEmail) {
    this.userEmail = this.initialEmail;
  }

    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.userEmail = params['email'];
        if (params['reVerify'] === 'true') {
          this.currentStep = 2;
        }
      }
    });

    this.initRegisterForm();

    const areaCtrl = this.registerForm.get('area') as FormControl;
    const schoolCtrl = this.registerForm.get('school') as FormControl;

    this.filteredAreas = areaCtrl.valueChanges.pipe(
      startWith(areaCtrl.value || ''),
      map(value => this._filter(value || '', this.schoolService.allRegions()))
    );

    this.filteredSchools = schoolCtrl.valueChanges.pipe(
      startWith(schoolCtrl.value || ''),
      map(value => this._filter(value || '', this.schoolService.allFlattenedSchools()))
    );

    setTimeout(() => {
      areaCtrl.updateValueAndValidity({ emitEvent: true });
      schoolCtrl.updateValueAndValidity({ emitEvent: true });
    }, 100);
  }

  private initRegisterForm() {
    this.registerForm = new FormGroup({
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(20),
        // Validators.pattern(/^[\u4e00-\u9fa5a-zA-Z\s]{2,20}$/)
      ]),
      area: new FormControl('', [Validators.required, this.isInListValidator('area')]),
      school: new FormControl('', [Validators.required, this.isInListValidator('school')]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
      phone: new FormControl('', {
        validators: [Validators.required,Validators.pattern(/^09-\d{8}$/)],
        updateOn: 'blur'
      }),
      agreeTerms: new FormControl(false, [Validators.requiredTrue])
    }, { validators: this.passwordMatchValidator });
  }

  private _filter(value: string, options: string[]): string[] {
    const filterValue = value.toLowerCase().replace(/台/g, '臺');
    return options.filter(opt =>
      opt.toLowerCase().includes(filterValue) ||
      opt.toLowerCase().replace(/臺/g, '台').includes(value.toLowerCase())
    );
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword) return null;
    if (confirmPassword.value && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { passwordMismatch: true };
    } else {
      if (confirmPassword.hasError('mismatch')) confirmPassword.setErrors(null);
      return null;
    }
  }

  isInListValidator(type: 'school' | 'area'): ValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value;
      if (!value) return null;
      const options = type === 'school'
        ? this.schoolService.allFlattenedSchools()
        : this.schoolService.allRegions();
      if (options.length === 0) return null;
      const clean = value.trim().toLowerCase().replace(/台/g, '臺');
      const isValid = options.some(opt => opt.toLowerCase().replace(/台/g, '臺') === clean);
      return isValid ? null : { notInList: true };
    };
  }

  isValidSchoolEmail(): boolean {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu\.tw$/.test(this.userEmail);
  }

  onEmailChange() {
    this.isEmailTouched = this.userEmail.length > 0;

    const matched = getSchoolFromEmail(this.userEmail);
  const schoolCtrl = this.registerForm.get('school');

  if (matched) {
    schoolCtrl?.setValue(matched);
    schoolCtrl?.disable();
  } else {
    // email 還沒填完或認不出來，解鎖讓使用者自己填
    if (schoolCtrl?.disabled) {
      schoolCtrl.enable();
      schoolCtrl.setValue('');
    }
  }
  }

  onPhoneInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 2) value = value.substring(0, 2) + '-' + value.substring(2);
    this.registerForm.get('phone')?.setValue(value, { emitEvent: false });
  }

  openTermsDialog(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dialogRef = this.dialog.open(PlatformRulesComponent, {
      width: '550px',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      this.registerForm.get('agreeTerms')?.setValue(result === true);
      if (result === true) this.registerForm.get('agreeTerms')?.markAsDirty();
    });
  }

  onNextStep() {
    this.isEmailTouched = true;
    if (!this.registerForm.valid || !this.isValidSchoolEmail()) {
      this.registerForm.markAllAsTouched();
      Swal.fire({
        title: '註冊失敗',
        text: '欄位還沒填寫完整，或者 Email 格式不正確喔！',
        icon: 'warning',
        confirmButtonText: '回到表單檢查',
        confirmButtonColor: '#FB831D',
      });
      return;
    }

    Swal.fire({
      title: '正在發送驗證信',
      text: '請稍候...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const finalData: UserReq = {
      name: this.registerForm.get('name')?.value,
      email: this.userEmail,
      password: this.registerForm.get('password')?.value,
      location: this.registerForm.get('area')?.value,
      school: this.registerForm.getRawValue().school,
      phone: this.registerForm.get('phone')?.value?.trim() || null,
    };

    this.userService.register(finalData).subscribe({
      next: (res: BasicResponse) => {
        Swal.close();
        if (res.statusCode === 200) {
          this.currentStep = 2;
          this.startCountdown(60);
          this.cdr.detectChanges();
        } else if (res.statusCode === 400 && res.message === 'Email has found') {
          Swal.fire({
            title: '此信箱已被註冊',
            text: '請直接使用學校信箱登入。',
            icon: 'info',
            confirmButtonText: '前往登入',
            confirmButtonColor: '#FB831D',
          }).then(() => this.switchToLogin.emit());
        } else {
          Swal.fire({ title: '註冊失敗', text: res.message, icon: 'warning', confirmButtonColor: '#FB831D' });
        }
      },
      error: () => {
        Swal.close();
        Swal.fire({ title: '連線錯誤', text: '請稍後再試', icon: 'error', confirmButtonColor: '#e57373' });
      }
    });
  }

  isValidCode(): boolean {
    return /^[0-9]{6}$/.test(this.verificationCode);
  }

  onVerifyCode() {
    this.isCodeTouched = true;
    if (!this.isValidCode()) return;

    this.userService.verifyEmail({ email: this.userEmail, code: this.verificationCode }).subscribe({
      next: (res: BasicResponse) => {
        if (res.statusCode === 200) {
          this.currentStep = 3;
          this.cdr.detectChanges();
          Swal.fire({ title: '驗證成功！', text: '歡迎加入二手GO!', icon: 'success', confirmButtonColor: '#ffb74d', timer: 3000, showConfirmButton: false });
        } else if (res.statusCode === 400 && res.message === 'Invalid verification code') {
          Swal.fire({ icon: 'error', title: '驗證失敗', text: '驗證碼不正確或已過期！', confirmButtonText: '重新輸入', confirmButtonColor: '#e57373' });
          this.verificationCode = '';
        } else {
          Swal.fire({ title: '驗證失敗', text: res.message, icon: 'error', confirmButtonColor: '#e57373' });
        }
      },
      error: () => Swal.fire({ title: '連線錯誤', text: '請稍後再試', icon: 'error', confirmButtonColor: '#e57373' })
    });
  }

  resendEmail() {
    if (this.countdown() > 0) return;
    Swal.fire({ title: '正在發送驗證信', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    this.userService.resendCode(this.userEmail).subscribe({
      next: (res: BasicResponse) => {
        Swal.close();
        if (res.statusCode === 200) {
          Swal.fire({ title: '驗證信已重新發送！', icon: 'success', confirmButtonColor: '#5E9759' });
          this.startCountdown(60);
        } else if (res.statusCode === 400 && res.message === 'Account is verification') {
          Swal.fire({ title: '此帳號已完成驗證', text: '請直接登入。', icon: 'info', confirmButtonColor: '#FB831D' })
            .then(() => this.switchToLogin.emit());
        } else {
          Swal.fire({ title: '發送失敗', text: res.message, icon: 'error', confirmButtonColor: '#e57373' });
        }
      },
      error: () => {
        Swal.close();
        Swal.fire({ title: '連線錯誤', text: '請稍後再試', icon: 'error', confirmButtonColor: '#e57373' });
      }
    });
  }

  goToLogin() {
    this.currentStep = 1;
    this.switchToLogin.emit();
  }

  private startCountdown(seconds: number) {
    this.countdown.set(seconds);
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.countdown.update(val => val - 1);
      if (this.countdown() <= 0) clearInterval(this.timer);
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
