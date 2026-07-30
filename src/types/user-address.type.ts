export type UserAddress = {
  addressId: number;
  receiverName: string;
  receiverPhone: string;
  detailedAddress: string;
  ward: string;
  city: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string | null;
};

export type CreateUserAddressPayload = {
  receiverName: string;
  receiverPhone: string;
  detailedAddress: string;
  ward: string;
  city: string;
  isDefault?: boolean;
};

export type UpdateUserAddressPayload = Partial<CreateUserAddressPayload>;

export type UserAddressListResponseData = {
  addresses: UserAddress[];
};

export type UserAddressDetailResponseData = {
  address: UserAddress;
};

export type UserAddressApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};