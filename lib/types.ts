export type SellableProduct = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stockQuantity: number;
  unit: string;
};

export type CartLine = {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  unit: string;
};

export type CustomerOption = {
  id: string;
  fullName: string;
  phone: string | null;
};
