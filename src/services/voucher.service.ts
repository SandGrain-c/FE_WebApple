import type {
  CustomerVoucher,
  CustomerVoucherApiResponse,
  ValidateVoucherPayload,
  ValidateVoucherResult,
} from "@/types/voucher.type";

const CUSTOMER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function parseVoucherResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  let result: CustomerVoucherApiResponse<T>;

  try {
    result = (await response.json()) as CustomerVoucherApiResponse<T>;
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data;
}

/**
 * GET /api/vouchers/available
 *
 * Không gửi subTotal để Customer vẫn xem được điều kiện giá trị đơn tối thiểu.
 * Backend vẫn lọc theo auth, thời gian, trạng thái, lượt dùng toàn cục và user.
 */
export async function getAvailableVouchers(
  accessToken: string
): Promise<CustomerVoucher[]> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/vouchers/available`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return parseVoucherResponse<CustomerVoucher[]>(
    response,
    "Không thể tải danh sách voucher."
  );
}

/**
 * POST /api/vouchers/validate
 */
export async function validateVoucher(
  payload: ValidateVoucherPayload,
  accessToken: string
): Promise<ValidateVoucherResult> {
  const response = await fetch(`${CUSTOMER_API_BASE_URL}/vouchers/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  return parseVoucherResponse<ValidateVoucherResult>(
    response,
    "Không thể kiểm tra voucher."
  );
}
