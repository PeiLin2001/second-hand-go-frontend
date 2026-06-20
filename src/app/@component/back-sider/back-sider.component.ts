import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import {
  LucideAngularModule,
  Users,
  Handbag,
  Bell,
  ZodiacLibra,
  LogOut
} from 'lucide-angular';
@Component({
  selector: 'app-back-sider',
  imports: [LucideAngularModule,RouterModule,],
  templateUrl: './back-sider.component.html',
  styleUrl: './back-sider.component.scss',
})
export class BackSiderComponent {
  constructor(private router: Router) {}

  // Declare icon
  readonly UserIcon = Users;
  readonly HandbagIcon = Handbag;
  readonly BellIcon = Bell;
  readonly LibraIcon = ZodiacLibra;
  readonly LogoutIcon = LogOut;

  goToHome() {
    this.router.navigate(['/home']);
  }

  goToUser() {
    this.router.navigate(['/back_user']);
  }

  goToProduct() {
    this.router.navigate(['/back_product']);
  }

  goToReport() {
    this.router.navigate(['/report']);
  }

  goToAnnouncement() {
    this.router.navigate(['/announcement']);
  }

  logout() {
    this.router.navigate(['/login_register']); //連接到登入頁面
  }
}
