import { Component } from '@angular/core';

import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
} from 'lucide-angular';

@Component({
  selector: 'app-wish',
  imports: [LucideAngularModule],
  templateUrl: './wish.component.html',
  styleUrl: './wish.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({ }),
    },
  ]
})
export class WishComponent {

}
