import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PlatformRulesComponent } from '../platform-rules/platform-rules.component';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { map, Observable, startWith } from 'rxjs';
import { Router } from '@angular/router';
import { SchoolDataService } from '../../@Services/school-data.service';
import Swal from 'sweetalert2';
import { ValidatorFn } from '@angular/forms';

//PL寫的
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../@Services/user.service';
import { BasicResponse, UserReq } from '../../@Interface/user';


// 絲絨的
import { ApiTestService } from './../../@Services/api-test.service';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';


@Component({
  selector: 'app-login-register',
  imports: [LoginComponent, RegisterComponent],
  templateUrl: './login-register.component.html',
  styleUrl: './login-register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginRegisterComponent implements OnInit {
  isRegister = false;
  registerInitialStep = 1;
  registerInitialEmail = '';

  onSwitchToRegister(data: { step?: number, email?: string }) {
  this.registerInitialStep = data.step ?? 1;
  this.registerInitialEmail = data.email ?? '';
  this.isRegister = true;
}

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.isRegister = params['mode'] === 'register';
    });
  }

  gotoHome() {
    this.router.navigate(['/home']);
  }
}
