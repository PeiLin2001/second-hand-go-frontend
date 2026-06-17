import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Wish } from '../../@Services/wish-service.service';

import {
  LUCIDE_ICONS,
  LucideAngularModule, LucideIconProvider, MessageCircleMore
} from 'lucide-angular';

@Component({
  selector: 'app-wish-card',
  imports: [LucideAngularModule],
  templateUrl: './wish-card.component.html',
  styleUrl: './wish-card.component.scss',
  providers: [
      {
        provide: LUCIDE_ICONS,
        useValue: new LucideIconProvider({
         MessageCircleMore
        })
      }
    ]
})
export class WishCardComponent {

  constructor(
    private router: Router
    ){}

  ngOnInit(): void {
  }

  // 接收外部傳入的商品列表（必填）
  @Input() wishList: Wish[] = [];

  chat() { this.router.navigate(['/chat']); }
}
