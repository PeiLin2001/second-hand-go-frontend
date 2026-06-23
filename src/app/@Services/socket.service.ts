import { effect, Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private registeredUserId: number | null = null;
  totalUnread = signal<number>(0);

  constructor(private userService: UserService) {
    this.connectSocket();

    effect(() => {
      const user = this.userService.currentUser();
      if (user) {
        this.registerUser(user.userId);
      }
    });
  }

  private connectSocket() {
    if (!this.socket) {
      this.socket = io('http://localhost:9092', {
        transports: ['websocket'],
        forceNew: true, // 強制每次都建立乾淨的 websocket 通道
      });

      // 斷線重新註冊
      this.socket.on('connect', () => {
        if (this.registeredUserId !== null) {
          this.socket.emit('register_user', { userId: this.registeredUserId });
        }
      });
    }
  }

  //  登入註冊
  registerUser(userId: number) {
    this.registeredUserId = userId;
    if (this.socket) {
      this.socket.emit('register_user', { userId: userId });
    }
  }

  // 加入房間
  joinRoom(roomId: number, userName: string) {
    if (this.socket) {
      this.socket.emit('join_room', { roomId: roomId, userName: userName });
    }
  }

  // 發送訊息給後端
  sendMessage(messageData: { roomId: number | null, senderId: number | undefined, messageContent: string }) {
    if (this.socket) {
      this.socket.emit('chatevent', messageData);
    }
  }

  // 監聽後端廣播回來的訊息
  getMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('chatevent', (data: any) => {
        observer.next(data);
      });
    });
  }

  // 未讀總數
  setTotalUnread(count: number) {
    this.totalUnread.set(count);
  }
  incrementUnread(by: number = 1) {
    this.totalUnread.update(v => v + by);
  }
  decrementUnread(by: number) {
    this.totalUnread.update(v => Math.max(0, v - by));
  }

  // 監聽未讀數變動通知
  getUnreadUpdate(): Observable<{ roomId: number; unreadCount: number }> {
    return new Observable(observer => {
      this.socket.on('unreadCountUpdate', (data: any) => {
        observer.next(data);
      });
    });
  }

  // 離開房間
  leaveRoom(roomId: number, userName: string) {
    if (this.socket) {
      this.socket.emit('leave_room', { roomId: roomId, userName: userName });
    }
  }
}
