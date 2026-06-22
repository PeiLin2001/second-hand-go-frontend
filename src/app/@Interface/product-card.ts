export interface ProductCard {
  productId: number,
  userId:number,

  title: string; // 對應後端productName
  description: string,
  price: number;
  type: string[];

  time: string;
  condition: string;
  imgUrl: string;
  status: string,

  grade: string[],
  location: string[],
  deptGroup:string[],

  user: {
    userName: string;
    userImg: string;
    university: string;
    department: string;
    goodLevel: number;
  };
}
