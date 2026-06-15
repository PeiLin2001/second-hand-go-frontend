import { Component, computed, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

// 素材庫
import { LucideAngularModule, MessageCircleMore, ChevronDownIcon } from 'lucide-angular';
import { UserService } from '../../@Services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-actions',
  imports: [LucideAngularModule],
  templateUrl: './user-actions.component.html',
  styleUrl: './user-actions.component.scss'
})
export class UserActionsComponent {
  constructor(
    private router: Router,
    private actRoute: ActivatedRoute,
    private userService: UserService) { }

  // Declare icon
  readonly MessageIcon = MessageCircleMore;
  readonly ChevronDownIcon = ChevronDownIcon;

  // // Declare
  // userName = "小明";

  // Show menu
  isDisplayed = false;

  // 獲取使用者資料.絲絨
  get userData() {
    return this.userService.currentUser;
  }



  showMenu(event: Event) {
    event.stopPropagation();
    this.isDisplayed = !this.isDisplayed;
  }

  @HostListener('document:click')
  closeMenu() {
    this.isDisplayed = false;
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }
  goToStore() { // 絲絨更動
    let id = this.userService.currentUser().userId;
    if (id) { this.router.navigate(['/store', Number(id)]); }
  }
  goToSetting() {
    this.router.navigate(['/profile_settings']);
  }
  goToSell() {
    this.router.navigate(['/draft_list']);
  }
  goToOrder() {
    this.router.navigate(['/order_information']);
  }


  logout() {
    Swal.fire({
      title: "您確定要登出嗎",
      text: "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "登出",
      cancelButtonText: "取消"
    }).then((result) => {
      if (result.isConfirmed) {

        Swal.fire({
          title: "您已登出",
          text: "歡迎再次使用",
          icon: "success"
        });
        this.userService.logout().subscribe({
          next: () => this.router.navigate(['/home']),
          error: () => this.router.navigate(['/home'])
        });;
      }
    });

  }
}
