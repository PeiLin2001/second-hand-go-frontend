import { ApiTestService } from './../../@Services/api-test.service';
import { UserService } from './../../@Services/user.service';

import {
  Component,
  effect,
  NgZone,
  ElementRef,
  viewChild
} from '@angular/core';

import { SocketService } from '../../@Services/socket.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  Search,
  Paperclip,
  Trash2,
  ArrowLeft,
  MessageCircleMore
} from 'lucide-angular';
import Swal from 'sweetalert2';

import { Location } from '@angular/common';

@Component({
  selector: 'app-chat',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({
        Search,
        Paperclip,
        Trash2,
        ArrowLeft,
        MessageCircleMore
      }),
    },
  ],
})
export class ChatComponent {
  constructor(
    private socketService: SocketService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private apiTestService: ApiTestService,
    private location: Location,
  ) {
    effect(() => {
      const user = this.userService.currentUser();
      const islogin = this.userService.isLoggedIn;
      if (user) {
        this.userName = user.userName;
        this.userId = user.userId;
        this.checkAndFetchRoom();
        this.getAllRoom(user.userId);
      } else if (islogin() && !user && !this.adminRoomInitiated) {
        this.adminRoomInitiated = true;
        this.userName = 'admin';
        this.userId = 0;
        this.checkAndFetchRoom();
        this.getAllRoom(this.userId);
      }
    });
  }
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);
  private readonly scrollContainer = viewChild.required<ElementRef>('scrollContainer');

  enter: string = '';
  userId: number = 0;
  userName: string = '我恨非同步。';
  message: any[] = [];
  partnerId: number | null = null;
  roomId: number | null = null;
  roomProductId: number = 0;
  urlProductId: number | null = null; // 網址帶來的商品 ID
  chatHistoryList: any[] = []; // 側邊欄的歷史紀錄清單
  keyword = ''; // 搜尋
  roomList: any[] = [];
  pictures: string[] = [];
  readonly MAX_IMAGES = 3;
  errorMessage: string | null = null;
  activeImageUrl: string | null = null; // 控制放大圖片的變數
  product: any;
  private adminRoomInitiated = false; // 防止重複建立

  ngOnInit(): void {
    this.scrollToBottom();
    // 帶聊天對象ID
    let idFromUrl = this.route.snapshot.paramMap.get('id');
    if (idFromUrl) {
      this.partnerId = Number(idFromUrl);
    }

    // 帶商品ID
    let productIdStr = this.route.snapshot.queryParamMap.get('productId');
    if (productIdStr) {
      this.urlProductId = +productIdStr;
      this.fetchProduct(this.urlProductId);
    }

    this.socketService
      .getMessage()
      .pipe(
        takeUntilDestroyed(this.destroyRef), // 元件死掉時自動退訂。
      )
      .subscribe({
        next: (data: any) => {
          console.log('data:', data);
          this.zone.run(() => {
            this.message = [...this.message, data];
            this.scrollToBottom();
          });
        },
        error: (err) => console.error('Socket 接收失敗:', err),
      });
  }

  private checkAndFetchRoom() {
    if (this.userId == null || this.partnerId == null) return;

    let ChatRoomReq = { initiatorId: this.userId, receiverId: this.partnerId };
    this.apiTestService.getOrCreateRoom(ChatRoomReq).subscribe({
      next: (room: any) => {
        console.log('room', room);
        this.roomId = room.roomId;
        this.roomProductId = room.productId;

        if (this.roomId !== null) {
          this.socketService.joinRoom(this.roomId, this.userName);
          this.readAllRoomMessages(this.roomId, this.userId!);
          this.fetchHistory(this.roomId);
          this.checkAndUpdateRoomProduct();
          this.getAllRoom(this.userId!);

          if (this.roomProductId) {
            this.fetchProduct(this.roomProductId);
          }
        } else {
          console.error('得到的房號是 null，無法加入 Socket 房間！');
        }
      },
      error: (err) => console.error('取得房間失敗:', err),
    });
  }

  private fetchHistory(roomId: number) {
    this.apiTestService.history(roomId).subscribe({
      next: (res) => {
        this.message = res.chatMessageVo || [];
        this.scrollToBottom(); // 滾輪捲到最底下
      },
      error: (err) => console.error('history 接收失敗:', err),
    });
  }

  private getAllRoom(userId: number) {
    this.apiTestService.getAllRoom(userId).subscribe({
      next: (room) => {
        console.log('roomList', room);
        this.roomList = room.chatRoomVo || [];
      },
      error: (err) => console.error('roomList 接收失敗:', err),
    });
  }

  readAllRoomMessages(roomId: number, userId: number) {
    this.apiTestService.readAllRoomMessages(roomId, userId).subscribe({
      next: (res) => {},
      error: (err) => console.error('readMessages 失敗:', err),
    });
  }

  sendMsg() {
    if (!this.enter.trim()) return; // 防呆：沒打字就不送出

    let messageData = {
      roomId: this.roomId,
      senderId: this.userId,
      messageContent: this.enter,
    };
    // 發送訊息給後端（注意：Socket 發送通常是直接 emit，不需要 .subscribe）
    this.socketService.sendMessage(messageData);
    this.enter = '';
  }

  goToHome() {
    this.router.navigate(['/home']);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.scrollContainer().nativeElement.scrollTop =
          this.scrollContainer().nativeElement.scrollHeight;
      }, 50);
    } catch (err) {
      console.error('滾動失敗：', err);
    }
  }

  // 側邊搜尋
  get filteredRoomList() {
    if (!this.keyword.trim()) {
      return this.roomList;
    }

    const keyword = this.keyword.toLowerCase().trim();

    // 名字或 ID 只要包含了關鍵字就留下來
    return this.roomList.filter((room) => {
      const nameMatch = room.targetUserName?.toLowerCase().includes(keyword);
      const idMatch = room.targetUserId?.toString().includes(keyword);

      return nameMatch || idMatch;
    });
  }

  changePartner(partner: any) {
    if (!partner || !partner.roomId) return;
    console.log(partner);

    this.product = null;
    this.roomId = partner.roomId;
    partner.unreadCount = 0;

    // this.router.navigate(['/chat', partner.targetUserId]); // 同步更新網址
    // 佩霖寫的 : 回上一頁 (聊天室改變id不算)
    this.router.navigate(['/chat', partner.targetUserId], { replaceUrl: true });

    this.socketService.joinRoom(partner.roomId, this.userName);
    this.readAllRoomMessages(partner.roomId, this.userId!);
    this.fetchHistory(partner.roomId);
    if (partner.productId > 0) {
      this.fetchProduct(partner.productId);
    }
  }

  // 上傳圖片
  uploadPicture(event: Event) {
    this.errorMessage = null;
    const element = event.currentTarget as HTMLInputElement;
    const file = element.files?.[0];
    if (!file) return;

    // 張數上限
    if (this.pictures.length >= this.MAX_IMAGES) {
      this.errorMessage = `最多只能上傳 ${this.MAX_IMAGES} 張圖片！`;
      this.scrollToBottom();
      return;
    }

    // 格式檢查
    if (!file.type.startsWith('image/')) {
      this.errorMessage = '請上傳正確的圖片格式（PNG, JPG, JPEG）！';
      this.scrollToBottom();
      return;
    }

    // 大小檢查（2MB）
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = '檔案大小不能超過 2MB！';
      this.scrollToBottom();
      return;
    }

    // 產生預覽
    const reader = new FileReader();
    reader.onload = () => {
      this.pictures.push(reader.result as string);
    };
    reader.readAsDataURL(file);
    this.scrollToBottom();
    element.value = ''; // 清空 input，讓同一張圖可以重複選
  }

  // 刪除指定圖片
  removeImage(index: number) {
    this.pictures.splice(index, 1);
    this.errorMessage = null;
  }

  // 圖片送出
  sendPic() {
    if (!this.pictures || this.pictures.length === 0) return;
    Swal.fire({
      title: '正在發送圖片',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    let body = { pictures: this.pictures };

    this.apiTestService.uploadPicture(body).subscribe({
      next: (res) => {
        let cloudImageUrl: string[] = res.imageUrls;
        let joinedUrls = cloudImageUrl.join(',');
        let messageData = {
          roomId: this.roomId,
          senderId: this.userId,
          messageContent: joinedUrls,
        };
        this.socketService.sendMessage(messageData);

        Swal.close();
        this.pictures = [];
        this.scrollToBottom();
      },
      error: (err) => console.error('圖片上傳失敗:', err),
    });
  }

  // 放大圖片
  openLightBox(url: string) {
    this.activeImageUrl = url;
  }

  // 關閉放大圖片
  closeLightBox() {
    this.activeImageUrl = null;
  }

  // 商品資訊
  private fetchProduct(productId: number) {
    this.apiTestService.searchByProductId(productId).subscribe({
      next: (product) => {
        this.product = product.productList[0];
      },
      error: (err) => console.error('撈取商品資訊失敗:', err),
    });
  }

  private checkAndUpdateRoomProduct() {
    if (this.urlProductId && this.urlProductId !== this.roomProductId) {
      this.apiTestService
        .updateProductId(this.urlProductId, this.roomId!)
        .subscribe({
          next: () => {
            this.roomProductId = this.urlProductId!;
          },
          error: (err) => console.error('更新房間商品失敗:', err),
        });
    }
  }

  goProduct(productId: number) {
    this.router.navigate(['/product_page', productId]);
  }

  readonly IMAGE_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.svg',
    '.webp',
  ]; // 支援的圖片格式

  // 圖片格式檢查方法
  isImageMessage(messageContent: string): boolean {
    if (!messageContent || !messageContent.includes('http')) {
      return false;
    }
    const lowerContent = messageContent.toLowerCase();

    return this.IMAGE_EXTENSIONS.some((ext) => lowerContent.endsWith(ext));
  }

  // 佩霖寫的 : 取得目前聊天對象的名字
  get currentPartnerName(): string {
    const currentRoom = this.roomList.find(
      (room) => room.roomId === this.roomId,
    );
    return currentRoom?.targetUserName ?? '';
  }

  // 佩霖寫的 : 回上一頁
  goBack() {
    this.location.back();
  }

  // 關閉聊天室
  ngOnDestroy() {
    if (!this.roomId && !this.userName) return;
    this.socketService.leaveRoom(this.roomId!, this.userName);
  }
}
