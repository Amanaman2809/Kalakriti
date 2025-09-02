import express from "express";
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  PrismaClient,
} from "../../generated/prisma/client";
import { requireAdmin, requireAuth } from "../../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// Define the where input type
type OrderWhereInput = Prisma.OrderWhereInput;

// Define valid sort fields type
type ValidSortField =
  | "createdAt"
  | "total"
  | "updatedAt"
  | "shippedAt"
  | "deliveredAt"
  | "status"
  | "paymentStatus";

// Define order by type
type OrderByInput = Prisma.OrderOrderByWithRelationInput;

// Fetch orders with comprehensive filtering and sorting (admin only)
router.get("/admin/orders", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      start,
      end,
      status,
      paymentStatus,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 50,
    } = req.query;

    // Build where clause dynamically with proper typing
    const where: OrderWhereInput = {};

    // Date range filtering
    if (start || end) {
      where.createdAt = {};

      if (start) {
        const startDate = new Date(start as string);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ error: "Invalid start date format" });
        }
        where.createdAt.gte = startDate;
      }

      if (end) {
        const endDate = new Date(end as string);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ error: "Invalid end date format" });
        }
        // Set end date to end of day to include full day
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Status filtering
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      // Validate status values against your OrderStatus enum
      const validStatuses: OrderStatus[] = ["SHIPPED", "DELIVERED", "PLACED"];

      const invalidStatuses = statusArray.filter(
        (s) =>
          !validStatuses.includes(s.toString().toUpperCase() as OrderStatus),
      );

      if (invalidStatuses.length > 0) {
        return res.status(400).json({
          error: `Invalid status values: ${invalidStatuses.join(", ")}. Valid statuses: ${validStatuses.join(", ")}`,
        });
      }

      if (statusArray.length === 1) {
        where.status = statusArray[0].toString().toUpperCase() as OrderStatus;
      } else {
        where.status = {
          in: statusArray.map((s) => s.toString().toUpperCase() as OrderStatus),
        };
      }
    }

    // Payment status filtering
    if (paymentStatus) {
      const paymentStatusArray = Array.isArray(paymentStatus)
        ? paymentStatus
        : [paymentStatus];
      // Validate payment status values against your PaymentStatus enum
      const validPaymentStatuses: PaymentStatus[] = [
        "PENDING",
        "FAILED",
        "PAID",
      ];

      const invalidPaymentStatuses = paymentStatusArray.filter(
        (ps) =>
          !validPaymentStatuses.includes(
            ps.toString().toUpperCase() as PaymentStatus,
          ),
      );

      if (invalidPaymentStatuses.length > 0) {
        return res.status(400).json({
          error: `Invalid payment status values: ${invalidPaymentStatuses.join(", ")}. Valid payment statuses: ${validPaymentStatuses.join(", ")}`,
        });
      }

      if (paymentStatusArray.length === 1) {
        where.paymentStatus = paymentStatusArray[0]
          .toString()
          .toUpperCase() as PaymentStatus;
      } else {
        where.paymentStatus = {
          in: paymentStatusArray.map(
            (ps) => ps.toString().toUpperCase() as PaymentStatus,
          ),
        };
      }
    }

    // Sorting configuration
    const validSortFields: ValidSortField[] = [
      "createdAt",
      "total",
      "updatedAt",
      "shippedAt",
      "deliveredAt",
      "status",
      "paymentStatus",
    ];
    const validSortOrders = ["asc", "desc"] as const;

    if (!validSortFields.includes(sortBy as ValidSortField)) {
      return res.status(400).json({
        error: `Invalid sortBy field. Valid fields: ${validSortFields.join(", ")}`,
      });
    }

    if (
      !validSortOrders.includes(
        (sortOrder as string).toLowerCase() as "asc" | "desc",
      )
    ) {
      return res.status(400).json({
        error: `Invalid sortOrder. Valid orders: ${validSortOrders.join(", ")}`,
      });
    }

    // Build orderBy with proper typing
    const orderBy: OrderByInput = {};
    const sortField = sortBy as ValidSortField;
    const sortDirection = (sortOrder as string).toLowerCase() as "asc" | "desc";

    // Use type assertion to handle dynamic property assignment
    (orderBy as any)[sortField] = sortDirection;

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: "Page must be >= 1, limit must be between 1 and 100",
      });
    }

    const skip = (pageNum - 1) * limitNum;

    // Execute query with total count for pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                },
              },
            },
          },
          address: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: limitNum,
      },
      filters: {
        dateRange: start || end ? { start, end } : null,
        status: status || null,
        paymentStatus: paymentStatus || null,
        sortBy,
        sortOrder,
      },
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Alternative implementation with a builder function (more type-safe)
const buildOrderWhere = (filters: {
  start?: string;
  end?: string;
  status?: string | string[];
  paymentStatus?: string | string[];
}): OrderWhereInput => {
  const where: OrderWhereInput = {};

  // Date range filtering
  if (filters.start || filters.end) {
    where.createdAt = {};

    if (filters.start) {
      const startDate = new Date(filters.start);
      if (!isNaN(startDate.getTime())) {
        where.createdAt.gte = startDate;
      }
    }

    if (filters.end) {
      const endDate = new Date(filters.end);
      if (!isNaN(endDate.getTime())) {
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }
  }

  // Status filtering
  if (filters.status) {
    const statusArray = Array.isArray(filters.status)
      ? filters.status
      : [filters.status];
    const validStatuses: OrderStatus[] = ["PLACED", "SHIPPED", "DELIVERED"];

    const validStatusValues = statusArray
      .map((s) => s.toString().toUpperCase() as OrderStatus)
      .filter((s) => validStatuses.includes(s));

    if (validStatusValues.length > 0) {
      if (validStatusValues.length === 1) {
        where.status = validStatusValues[0];
      } else {
        where.status = { in: validStatusValues };
      }
    }
  }

  // Payment status filtering
  if (filters.paymentStatus) {
    const paymentStatusArray = Array.isArray(filters.paymentStatus)
      ? filters.paymentStatus
      : [filters.paymentStatus];
    const validPaymentStatuses: PaymentStatus[] = ["PENDING", "FAILED", "PAID"];

    const validPaymentStatusValues = paymentStatusArray
      .map((ps) => ps.toString().toUpperCase() as PaymentStatus)
      .filter((ps) => validPaymentStatuses.includes(ps));

    if (validPaymentStatusValues.length > 0) {
      if (validPaymentStatusValues.length === 1) {
        where.paymentStatus = validPaymentStatusValues[0];
      } else {
        where.paymentStatus = { in: validPaymentStatusValues };
      }
    }
  }

  return where;
};

const buildOrderBy = (sortBy: string, sortOrder: string): OrderByInput => {
  const validSortFields: ValidSortField[] = [
    "createdAt",
    "total",
    "updatedAt",
    "shippedAt",
    "deliveredAt",
    "status",
    "paymentStatus",
  ];

  if (!validSortFields.includes(sortBy as ValidSortField)) {
    return { createdAt: "desc" }; // Default fallback
  }

  const direction = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";
  const orderBy: OrderByInput = {};

  // Use a switch statement for type safety
  switch (sortBy as ValidSortField) {
    case "createdAt":
      orderBy.createdAt = direction;
      break;
    case "total":
      orderBy.total = direction;
      break;
    case "updatedAt":
      orderBy.updatedAt = direction;
      break;
    case "shippedAt":
      orderBy.shippedAt = direction;
      break;
    case "deliveredAt":
      orderBy.deliveredAt = direction;
      break;
    case "status":
      orderBy.status = direction;
      break;
    case "paymentStatus":
      orderBy.paymentStatus = direction;
      break;
    default:
      orderBy.createdAt = direction;
  }

  return orderBy;
};

// Alternative route using the builder functions (more type-safe)
router.get("/admin/orders-v2", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      start,
      end,
      status,
      paymentStatus,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 50,
    } = req.query;

    // Build where clause using the builder function
    const where = buildOrderWhere({
      start: start as string,
      end: end as string,
      status: status as string | string[],
      paymentStatus: paymentStatus as string | string[],
    });

    // Build orderBy using the builder function
    const orderBy = buildOrderBy(sortBy as string, sortOrder as string);

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as string) || 50),
    );
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                },
              },
            },
          },
          address: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum,
      },
      filters: {
        dateRange: start || end ? { start, end } : null,
        status: status || null,
        paymentStatus: paymentStatus || null,
        sortBy,
        sortOrder,
      },
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Helper route to get filter options (useful for frontend dropdowns)
router.get(
  "/admin/orders/filters",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      // Get unique status and payment status values from database
      const statusOptions = await prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
      });

      const paymentStatusOptions = await prisma.order.groupBy({
        by: ["paymentStatus"],
        _count: { paymentStatus: true },
      });

      // Get date range of orders
      const dateRange = await prisma.order.aggregate({
        _min: { createdAt: true },
        _max: { createdAt: true },
      });

      res.json({
        statusOptions: statusOptions.map((s) => ({
          value: s.status,
          count: s._count.status,
        })),
        paymentStatusOptions: paymentStatusOptions.map((ps) => ({
          value: ps.paymentStatus,
          count: ps._count.paymentStatus,
        })),
        dateRange: {
          earliest: dateRange._min.createdAt,
          latest: dateRange._max.createdAt,
        },
        sortOptions: [
          { value: "createdAt", label: "Date Created" },
          { value: "total", label: "Total Amount" },
          { value: "updatedAt", label: "Last Updated" },
          { value: "shippedAt", label: "Shipped Date" },
          { value: "deliveredAt", label: "Delivered Date" },
          { value: "status", label: "Status" },
          { value: "paymentStatus", label: "Payment Status" },
        ],
      });
    } catch (err) {
      console.error("Error fetching filter options:", err);
      res.status(500).json({ error: "Failed to fetch filter options" });
    }
  },
);

export default router;
