import { WishServiceService, Wisher } from './../../@Services/wish-service.service';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EduApiGovService } from '../../@Services/edu-api-gov.service';
import { UserService } from '../../@Services/user.service';
import { Wish } from './../../@Services/wish-service.service';
import {
  LUCIDE_ICONS,
  LucideAngularModule, LucideIconProvider, MessageCircleMore
} from 'lucide-angular';

@Component({
  selector: 'app-school-community-seeking',
  imports: [LucideAngularModule],
  templateUrl: './school-community-seeking.component.html',
  styleUrl: './school-community-seeking.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({
       MessageCircleMore
      })
    }
  ]
})
export class SchoolCommunitySeekingComponent {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private eduApiGovService: EduApiGovService,
    private userService: UserService,
    private wishServiceService: WishServiceService
  ) {}

  ngOnInit(): void {
    // get the data resource by parent route
    const schoolId = Number(
      this.route.parent?.snapshot.paramMap.get('id')
    );

    // get the school data by id
    this.eduApiGovService.getSchools().subscribe(data => {

      // Datas of the target school
      const school = data.find(
        s => Number(s['代碼']) === schoolId
      );

      if (!school) return;

      const schoolName = school['學校名稱'];

      this.wishServiceService.getWishesBySchool(schoolName)
      .subscribe(res => {
        this.wishList = res.wishesList;
      })
    });

  } // The end of ngOninit

  // 資料
  wishList:Wish[] = [];

  // 聊聊
  chat() { this.router.navigate(['/chat']); }

}
