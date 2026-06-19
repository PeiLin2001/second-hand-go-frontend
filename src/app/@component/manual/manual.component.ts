import { Component } from '@angular/core';
import {
  LucideAngularModule, LUCIDE_ICONS, LucideIconProvider,
  UserRoundPlus,Search,Send,UserStar,Handshake,Check
} from 'lucide-angular';

@Component({
  selector: 'app-manual',
  imports: [LucideAngularModule],
  templateUrl: './manual.component.html',
  styleUrl: './manual.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({
        UserRoundPlus,Check,
        Search,Send,UserStar,Handshake

      })
    }
  ]
})
export class ManualComponent {

}
