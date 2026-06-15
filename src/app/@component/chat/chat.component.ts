import { ApiTestService } from './../../@Services/api-test.service';
import { UserService } from './../../@Services/user.service';
import { Component, effect } from '@angular/core';
import { SocketService } from '../../@Services/socket.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  constructor(private socketService: SocketService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private apiTestService: ApiTestService,
  ) {
    effect(() => {
      const user = this.userService.currentUser();
      if (user) {
        this.userName = user.userName;
        this.userId = user.userId;
        this.checkAndFetchRoom();
      }
    });
  }
  private destroyRef = inject(DestroyRef);

  enter: string = '';
  userId?: number;
  userName: string = '我恨非同步。';
  message: any[] = [];
  partnerId: number | null = null;
  roomId: number | null = null;
  chatHistoryList: any[] = []; // 側邊欄的歷史紀錄清單

  ngOnInit(): void {
    // 1.去撈目前使用者的所有歷史對話清單

    // 帶參數
    let idFromUrl = this.route.snapshot.paramMap.get('id');
    if (idFromUrl) {
      this.partnerId = Number(idFromUrl);
      this.checkAndFetchRoom();
    }

    this.socketService.getMessage().pipe(
      takeUntilDestroyed(this.destroyRef) // 元件死掉時自動退訂。
    ).subscribe({
      next: (data: any) => {
        this.message.push(data);
        console.log('data:', data);
      },
      error: (err) => console.error('Socket 接收失敗:', err)
    });
  }

  private checkAndFetchRoom() {
    if (!this.userId || !this.partnerId) return;

    let ChatRoomReq = {
      initiatorId: this.userId,
      receiverId: this.partnerId
    };
    this.apiTestService.getOrCreateRoom(ChatRoomReq).subscribe({
      next: (room: any) => {
        this.roomId = room.roomId;
        console.log(' 成功取得/建立房間！房號為：', this.roomId);
        if (this.roomId !== null) {
          this.socketService.joinRoom(this.roomId, this.userName);
        } else {
          console.error('得到的房號是 null，無法加入 Socket 房間！');
        }
      },
      error: (err) => console.error('取得房間失敗:', err)
    });
  }

  sendMsg() {
    if (!this.enter.trim()) return; // 防呆：沒打字就不送出

    let messageData = {
      roomId: this.roomId,
      senderId: this.userId,
      messageContent: this.enter
    };
    // 發送訊息給後端（注意：Socket 發送通常是直接 emit，不需要 .subscribe）
    this.socketService.sendMessage(messageData);
    this.enter = '';
  }

  goToHome() {
    this.router.navigate(['/home']);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

}
