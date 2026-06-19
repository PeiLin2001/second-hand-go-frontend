import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../@Services/user.service';
import Swal from 'sweetalert2';

export const authGuard: CanActivateFn = async (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  // 檢查使用者是否登入
  if (userService.isLoggedIn()) {
    return true; // 已登入，放行！
  }

  // 未登入，彈出 SweetAlert 警告
  await Swal.fire({
    title: '請先登入',
    text: '您需要登入後才能存取此頁面！',
    icon: 'warning',
    confirmButtonText: '前往登入',
    confirmButtonColor: '#F7D175',
  });

  return router.createUrlTree(['/login_register']);
};
