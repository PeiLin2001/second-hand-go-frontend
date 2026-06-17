import { BasicResponse } from "./user";

// 先定義每一筆收藏商品的「單品規格」 (對齊 Java 的 CollectVoList)
export interface CollectVoList {
  collectId: number;
  productName: string;
  imgPath: string;
  decription: string;
  condition: string;
  price: number;
  sellerName: string;
  sellerImg: string;
  school: string;
  location: string[];
  productId: number;
  sellerId: number;
}

// 定義整包大池子的回應格式
export interface CollectRes extends BasicResponse {
  collectListVo: CollectVoList[];
}
