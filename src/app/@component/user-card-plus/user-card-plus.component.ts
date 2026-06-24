import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../../@Interface/user';

@Component({
  selector: 'app-user-card-plus',
  imports: [RouterLink],
  templateUrl: './user-card-plus.component.html',
  styleUrl: './user-card-plus.component.scss',
})
export class UserCardPlusComponent {
  @Input() users: User[] = [];

  // 最多顯示幾筆，預設不限制（0 = 全部）
  @Input() maxItems: number = 0;

  get displayedUsers(): User[] {
    if (this.maxItems > 0) {
      return this.users.slice(0, this.maxItems);
    }
    return this.users;
  }
}
