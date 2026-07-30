"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createUserAddress,
  getUserAddresses,
} from "@/services/user-address.service";
import type {
  CreateUserAddressPayload,
  UserAddress,
} from "@/types/user-address.type";

type CheckoutAddressSelectorProps = {
  accessToken: string;
  selectedAddressId: number | null;
  onChange: (addressId: number) => void;
  disabled?: boolean;
};

type AddressFormState = {
  receiverName: string;
  receiverPhone: string;
  detailedAddress: string;
  ward: string;
  city: string;
  isDefault: boolean;
};

type AddressFormErrors = Partial<Record<keyof AddressFormState, string>>;

function getEmptyAddressFormState(): AddressFormState {
  return {
    receiverName: "",
    receiverPhone: "",
    detailedAddress: "",
    ward: "",
    city: "",
    isDefault: false,
  };
}

function validateAddressForm(formState: AddressFormState) {
  const errors: AddressFormErrors = {};

  if (!formState.receiverName.trim()) {
    errors.receiverName = "Vui lòng nhập tên người nhận.";
  }

  if (!formState.receiverPhone.trim()) {
    errors.receiverPhone = "Vui lòng nhập số điện thoại.";
  } else if (!/^[0-9+\-\s()]{8,20}$/.test(formState.receiverPhone.trim())) {
    errors.receiverPhone = "Số điện thoại chưa hợp lệ.";
  }

  if (!formState.detailedAddress.trim()) {
    errors.detailedAddress = "Vui lòng nhập địa chỉ cụ thể.";
  }

  if (!formState.ward.trim()) {
    errors.ward = "Vui lòng nhập phường/xã.";
  }

  if (!formState.city.trim()) {
    errors.city = "Vui lòng nhập tỉnh/thành phố.";
  }

  return errors;
}

function formatAddress(address: UserAddress) {
  return [address.detailedAddress, address.ward, address.city]
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutAddressSelector({
  accessToken,
  selectedAddressId,
  onChange,
  disabled = false,
}: CheckoutAddressSelectorProps) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState<AddressFormState>(
    getEmptyAddressFormState
  );
  const [formErrors, setFormErrors] = useState<AddressFormErrors>({});

  const selectedAddress = useMemo(() => {
    return addresses.find((address) => address.addressId === selectedAddressId);
  }, [addresses, selectedAddressId]);

  async function fetchAddresses() {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getUserAddresses(accessToken);
      setAddresses(result.addresses);

      if (result.addresses.length > 0 && !selectedAddressId) {
        const defaultAddress =
          result.addresses.find((address) => address.isDefault) ||
          result.addresses[0];

        onChange(defaultAddress.addressId);
      }
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Không thể tải danh sách địa chỉ.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleCreateAddress() {
    const nextErrors = validateAddressForm(formState);
    setFormErrors(nextErrors);
    setError(null);
  
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
  
    try {
      setIsCreating(true);
  
      const payload: CreateUserAddressPayload = {
        receiverName: formState.receiverName.trim(),
        receiverPhone: formState.receiverPhone.trim(),
        detailedAddress: formState.detailedAddress.trim(),
        ward: formState.ward.trim(),
        city: formState.city.trim(),
        isDefault: addresses.length === 0 ? true : formState.isDefault,
      };
  
      const result = await createUserAddress(payload, accessToken);
  
      await fetchAddresses();
  
      onChange(result.address.addressId);
      setFormState(getEmptyAddressFormState());
      setFormErrors({});
      setIsAddFormOpen(false);
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Không thể thêm địa chỉ.";
  
      setError(message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="rounded-2xl border border-surface-container-high bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-on-surface">
            Địa chỉ nhận hàng
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Chọn địa chỉ đã lưu hoặc thêm địa chỉ mới để đặt hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddFormOpen((current) => !current)}
          disabled={disabled || isCreating}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary px-4 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">
            {isAddFormOpen ? "close" : "add_location_alt"}
          </span>
          {isAddFormOpen ? "Đóng" : "Thêm địa chỉ"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-5 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-5 text-center">
          <span className="material-symbols-outlined animate-spin text-2xl text-primary">
            progress_activity
          </span>
          <p className="mt-2 text-sm font-medium text-secondary">
            Đang tải địa chỉ...
          </p>
        </div>
      ) : addresses.length > 0 ? (
        <div className="mt-5 space-y-3">
          {addresses.map((address) => {
            const isSelected = address.addressId === selectedAddressId;

            return (
              <button
                key={address.addressId}
                type="button"
                onClick={() => onChange(address.addressId)}
                disabled={disabled}
                className={`flex w-full gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                    : "border-surface-container-high bg-white hover:border-primary/60"
                }`}
              >
                <span
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant bg-white"
                  }`}
                >
                  {isSelected ? (
                    <span className="material-symbols-outlined text-sm">
                      check
                    </span>
                  ) : null}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-on-surface">
                      {address.receiverName}
                    </p>

                    <span className="text-sm text-secondary">
                      {address.receiverPhone}
                    </span>

                    {address.isDefault ? (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        Mặc định
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm leading-6 text-secondary">
                    {formatAddress(address)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 text-sm text-secondary">
          Bạn chưa có địa chỉ nhận hàng. Hãy thêm địa chỉ mới để tiếp tục đặt
          hàng.
        </div>
      )}

      {selectedAddress ? (
        <div className="mt-4 rounded-2xl bg-surface-container-lowest p-4 text-sm">
          <p className="font-semibold text-on-surface">Đang chọn:</p>
          <p className="mt-1 text-secondary">
            {selectedAddress.receiverName} - {selectedAddress.receiverPhone}
          </p>
          <p className="mt-1 text-secondary">{formatAddress(selectedAddress)}</p>
        </div>
      ) : null}

      {isAddFormOpen || addresses.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-4">
          <h3 className="font-semibold text-on-surface">Thêm địa chỉ mới</h3>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Người nhận <span className="text-red-500">*</span>
              </label>
              <input
                value={formState.receiverName}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    receiverName: event.target.value,
                  })
                }
                disabled={disabled || isCreating}
                className="h-11 w-full rounded-xl border border-surface-container-high bg-white px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Nguyễn Văn A"
              />
              {formErrors.receiverName ? (
                <p className="mt-1 text-xs text-red-600">
                  {formErrors.receiverName}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                value={formState.receiverPhone}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    receiverPhone: event.target.value,
                  })
                }
                disabled={disabled || isCreating}
                className="h-11 w-full rounded-xl border border-surface-container-high bg-white px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="0900000000"
              />
              {formErrors.receiverPhone ? (
                <p className="mt-1 text-xs text-red-600">
                  {formErrors.receiverPhone}
                </p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Địa chỉ cụ thể <span className="text-red-500">*</span>
              </label>
              <input
                value={formState.detailedAddress}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    detailedAddress: event.target.value,
                  })
                }
                disabled={disabled || isCreating}
                className="h-11 w-full rounded-xl border border-surface-container-high bg-white px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Số nhà, khu phố..."
              />
              {formErrors.detailedAddress ? (
                <p className="mt-1 text-xs text-red-600">
                  {formErrors.detailedAddress}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Phường/Xã <span className="text-red-500">*</span>
              </label>
              <input
                value={formState.ward}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    ward: event.target.value,
                  })
                }
                disabled={disabled || isCreating}
                className="h-11 w-full rounded-xl border border-surface-container-high bg-white px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Hoàng Quế"
              />
              {formErrors.ward ? (
                <p className="mt-1 text-xs text-red-600">{formErrors.ward}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Tỉnh/Thành phố <span className="text-red-500">*</span>
              </label>
              <input
                value={formState.city}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    city: event.target.value,
                  })
                }
                disabled={disabled || isCreating}
                className="h-11 w-full rounded-xl border border-surface-container-high bg-white px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Quảng Ninh"
              />
              {formErrors.city ? (
                <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>
              ) : null}
            </div>
          </div>

          {addresses.length > 0 ? (
            <label className="mt-4 flex items-center gap-2 text-sm font-medium text-on-surface">
              <input
                type="checkbox"
                checked={formState.isDefault}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    isDefault: event.target.checked,
                  })
                }
                disabled={disabled || isCreating}
                className="h-4 w-4 rounded border-outline-variant text-primary"
              />
              Đặt làm địa chỉ mặc định
            </label>
          ) : null}

<button
  type="button"
  onClick={handleCreateAddress}
  disabled={disabled || isCreating}
  className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
>
            {isCreating ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">
                  progress_activity
                </span>
                Đang lưu...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">save</span>
                Lưu địa chỉ
              </>
            )}
          </button>
          </div>
      ) : null}
    </section>
  );
}