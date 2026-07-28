import type {
  CustomerShipment,
  CustomerShipmentApiResponse,
  CustomerShipmentDetailResponseData,
  CustomerShipmentListResponseData,
} from "@/types/customer-shipment.type";

const CUSTOMER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function parseCustomerShipmentResponse<T>(
  response: Response
): Promise<CustomerShipmentApiResponse<T>> {
  const data = (await response.json()) as CustomerShipmentApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
  }

  return data;
}

function normalizeShipmentListData(data: unknown): CustomerShipmentListResponseData {
  if (Array.isArray(data)) {
    return {
      items: data as CustomerShipment[],
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return {
      items: (data as { items: CustomerShipment[] }).items,
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "shipments" in data &&
    Array.isArray((data as { shipments: unknown }).shipments)
  ) {
    return {
      items: (data as { shipments: CustomerShipment[] }).shipments,
    };
  }

  if (
    data &&
    typeof data === "object" &&
    "shipment" in data &&
    (data as { shipment: unknown }).shipment
  ) {
    return {
      items: [(data as { shipment: CustomerShipment }).shipment],
    };
  }

  if (data && typeof data === "object" && "shipmentId" in data) {
    return {
      items: [data as CustomerShipment],
    };
  }

  return {
    items: [],
  };
}

function normalizeShipmentDetailData(
  data: unknown
): CustomerShipmentDetailResponseData {
  if (data && typeof data === "object" && "shipment" in data) {
    return data as CustomerShipmentDetailResponseData;
  }

  return {
    shipment: data as CustomerShipment,
  };
}

/**
 * GET /api/shipments/orders/:orderId
 */
export async function getCustomerShipmentsByOrder(
  orderId: number,
  accessToken: string
): Promise<CustomerShipmentListResponseData> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/shipments/orders/${orderId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseCustomerShipmentResponse<unknown>(response);

  return normalizeShipmentListData(result.data);
}

/**
 * GET /api/shipments/:shipmentId
 */
export async function getCustomerShipmentById(
  shipmentId: number,
  accessToken: string
): Promise<CustomerShipmentDetailResponseData> {
  const response = await fetch(
    `${CUSTOMER_API_BASE_URL}/shipments/${shipmentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const result = await parseCustomerShipmentResponse<unknown>(response);

  return normalizeShipmentDetailData(result.data);
}