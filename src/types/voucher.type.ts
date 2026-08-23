export type CustomerVoucher = {
  voucherId: number;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
};

export type ValidateVoucherPayload = {
  code: string;
  subTotal: number;
};

export type ValidateVoucherResult = {
  voucher: CustomerVoucher;
  subTotal: number;
  discountAmount: number;
  totalAfterDiscount: number;
};

export type CustomerVoucherApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};
