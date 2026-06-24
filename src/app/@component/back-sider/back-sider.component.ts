import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import {
  LucideAngularModule,
  Users,
  Handbag,
  Bell,
  ZodiacLibra,
  LogOut,
} from 'lucide-angular';
import { UserService } from '../../@Services/user.service';
import Swal from 'sweetalert2';
import { SocketService } from '../../@Services/socket.service';

@Component({
  selector: 'app-back-sider',
  imports: [LucideAngularModule, RouterModule],
  templateUrl: './back-sider.component.html',
  styleUrl: './back-sider.component.scss',
})
export class BackSiderComponent {
  constructor(
    private router: Router,
    private userService: UserService,
    private socketService: SocketService,
  ) {}

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
    Swal.fire({
      title: '您確定要登出嗎',
      text: '',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: '登出',
      cancelButtonText: '取消',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: '您已登出',
          text: '歡迎再次使用',
          icon: 'success',
        });
        this.userService.logout().subscribe({
          next: () => {
            this.socketService.disconnect();
            this.router.navigate(['/home']);
          },
          error: () => {
            this.socketService.disconnect();
            this.router.navigate(['/home']);
          },
        });
      }
    });
  }
}
