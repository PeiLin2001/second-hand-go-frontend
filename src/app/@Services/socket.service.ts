import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;

  constructor() {
    this.connectSocket();
  }
  private connectSocket() {
    if (!this.socket) {
      this.socket = io('http://localhost:9092', {
        transports: ['websocket'],
        forceNew: true, // 強制每次都建立乾淨的 websocket 通道
      });
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

}
