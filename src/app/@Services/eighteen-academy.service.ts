import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EighteenAcademyService {

  constructor() { }

   academy = [
    { id: 1,  name: '資訊學群',       value: 'information', selected: false },
    { id: 2,  name: '工程學群',       value: 'engineering', selected: false },
    { id: 3,  name: '數理化學群',     value: 'science', selected: false },
    { id: 4,  name: '醫藥衛生學群',   value: 'medical', selected: false },
    { id: 5,  name: '生命科學學群',   value: 'life-science', selected: false },
    { id: 6,  name: '生物資源學群',   value: 'bio-resource', selected: false },
    { id: 7,  name: '地球與環境學群', value: 'earth-environment', selected: false },
    { id: 8,  name: '建築與設計學群', value: 'design', selected: false },
    { id: 9,  name: '藝術學群',       value: 'art', selected: false },
    { id: 10, name: '社會與心理學群', value: 'social-psychology', selected: false },
    { id: 11, name: '大眾傳播學群',   value: 'communication', selected: false },
    { id: 12, name: '外語學群',       value: 'language', selected: false },
    { id: 13, name: '文史哲學群',     value: 'humanities', selected: false },
    { id: 14, name: '教育學群',       value: 'education', selected: false },
    { id: 15, name: '法政學群',       value: 'law-politics', selected: false },
    { id: 16, name: '管理學群',       value: 'management', selected: false },
    { id: 17, name: '財經學群',       value: 'finance', selected: false },
    { id: 18, name: '遊憩與運動學群', value: 'sports-leisure', selected: false },
    { id: 19, name: '不拘',           value: 'all', selected: false }
  ];


}
