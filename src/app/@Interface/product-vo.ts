//賣家資訊
export interface SellerVo {
  userId: number;
  userName: string;
  school: string;
  userImgPath: string;
  department: string;
  goodLevel: number;
}

//商品核心資訊
export interface ProductVo {
  productId: number;
  userId: number;
  productName: string;
  description: string;
  price: number;
  imgPath: string[];
  type: string[];
  shelfDate: string;
  productCondition: string;
  status: string;
  grade: string[];
  location: string[];
  deptGroup: string[];
  seller: SellerVo;
}

//最外層包裹
export interface GetProductDataRes {
  statusCode: number;
  message: string;
  productList: ProductVo[];
}
