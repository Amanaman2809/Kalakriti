import { OrderDetails } from "./payment";
import { OrderDetail, OrderPayment } from "./types";

export function mapOrderDetailToUI(order: OrderDetail): OrderDetails {
  return {
    id: order.id,
    createdAt: order.createdAt,
    status: normalizeStatus(order.status),
    paymentMode: getPaymentMode(order.payments),
    address: order.address
      ? {
          street: order.address.street,
          city: order.address.city,
          state: order.address.state,
          postalCode: order.address.postalCode,
          country: order.address.country,
          phone: order.address.phone,
        }
      : undefined,
    carrierName: undefined,
    trackingNumber: undefined,
    total: order.financials.totalAmount,
    netAmount: order.financials.finalAmountToPay,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.product.id,
      quantity: item.quantity,
      price: item.price,
      product: {
        name: item.product.name,
        images: item.product.images,
      },
    })),
  };
}

function normalizeStatus(
  status: string,
): "PLACED" | "SHIPPED" | "DELIVERED" | "CANCELLED" {
  switch (status) {
    case "PENDING":
    case "CONFIRMED":
      return "PLACED";
    case "SHIPPED":
      return "SHIPPED";
    case "DELIVERED":
      return "DELIVERED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "PLACED";
  }
}

function getPaymentMode(payments: OrderPayment[]): "COD" | "ONLINE" {
  if (!payments || payments.length === 0) return "COD";
  const provider = payments[0].provider?.toLowerCase() ?? "";
  return provider.includes("cod") ? "COD" : "ONLINE";
}
