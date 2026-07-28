export type CartItem = {
  cartItemId: number;
  productId: number;
  variantId: number;
  name: string;
  slug: string;
  categorySlug: string;
  image: string;
  color: string;
  capacity: string;
  ram: string;
  sku: string;
  price: number;
  oldPrice: number | null;
  quantity: number;
  stockQuantity: number;
  selected: boolean;
};

export type CartResponse = {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  selectedQuantity: number;
  selectedTotalPrice: number;
};

export type AddToCartPayload = {
  productId: number;
  variantId: number;
  quantity?: number;
};

export type UpdateCartItemPayload = {
  quantity: number;
};

export type UpdateCartItemSelectedPayload = {
  selected: boolean;
};

export type SelectAllCartItemsPayload = {
  selected: boolean;
};

export type CartApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};