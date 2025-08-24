import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { requireAuth } from "../middlewares/requireAuth";
import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const router = express.Router();
const prisma = new PrismaClient();

// Enhanced validation middleware for address data
const validateAddress = [
  body("street")
    .trim()
    .notEmpty()
    .withMessage("Street address is required")
    .isLength({ min: 5, max: 255 })
    .withMessage("Street address must be between 5 and 255 characters"),
  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),
  body("state")
    .trim()
    .notEmpty()
    .withMessage("State/Province is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("State must be between 2 and 100 characters"),
  body("country")
    .trim()
    .notEmpty()
    .withMessage("Country is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Country must be between 2 and 100 characters"),
  body("postalCode")
    .trim()
    .notEmpty()
    .withMessage("Postal/ZIP code is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Postal code must be between 3 and 20 characters"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isLength({ min: 10, max: 20 })
    .withMessage("Phone number must be between 10 and 20 characters"),
];

// Error handling middleware
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Get all addresses for the authenticated user
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { isDefault: "desc" }, // Default addresses first
      select: {
        id: true,
        street: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: addresses,
      count: addresses.length,
    });
  } catch (err) {
    console.error("Failed to fetch addresses:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch addresses",
    });
  }
});

// Get a specific address
router.get(
  "/:id",
  requireAuth,
  [param("id").isUUID().withMessage("Invalid address ID")],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const address = await prisma.address.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
        select: {
          id: true,
          street: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          phone: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          error: "Address not found",
        });
      }

      res.json({
        success: true,
        data: address,
      });
    } catch (err) {
      console.error("Failed to fetch address:", err);
      res.status(500).json({
        success: false,
        error: "Failed to fetch address",
      });
    }
  }
);

// Add a new address
router.post(
  "/",
  requireAuth,
  validateAddress,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // Check if this is the first address for the user
      const existingAddresses = await prisma.address.count({
        where: { userId: req.user!.id },
      });

      const address = await prisma.address.create({
        data: {
          userId: req.user!.id,
          street: req.body.street,
          city: req.body.city,
          state: req.body.state,
          country: req.body.country,
          postalCode: req.body.postalCode,
          phone: req.body.phone,
          isDefault: existingAddresses === 0, // Set as default if first address
        },
        select: {
          id: true,
          street: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          phone: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(201).json({
        success: true,
        data: address,
        message: "Address created successfully",
      });
    } catch (err) {
      console.error("Failed to create address:", err);
      res.status(500).json({
        success: false,
        error: "Failed to create address",
      });
    }
  }
);

// Update an existing address
router.put(
  "/:id",
  requireAuth,
  [param("id").isUUID().withMessage("Invalid address ID"), ...validateAddress],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // Verify address exists and belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!existingAddress) {
        return res.status(404).json({
          success: false,
          error: "Address not found",
        });
      }

      const updatedAddress = await prisma.address.update({
        where: { id: req.params.id },
        data: {
          street: req.body.street,
          city: req.body.city,
          state: req.body.state,
          country: req.body.country,
          postalCode: req.body.postalCode,
          phone: req.body.phone,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          street: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          phone: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: updatedAddress,
        message: "Address updated successfully",
      });
    } catch (err) {
      console.error("Failed to update address:", err);
      res.status(500).json({
        success: false,
        error: "Failed to update address",
      });
    }
  }
);

// Delete an address
router.delete(
  "/:id",
  requireAuth,
  [param("id").isUUID().withMessage("Invalid address ID")],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // Verify address exists and belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!existingAddress) {
        return res.status(404).json({
          success: false,
          error: "Address not found",
        });
      }

      // If deleting the default address, set another address as default
      if (existingAddress.isDefault) {
        const anotherAddress = await prisma.address.findFirst({
          where: {
            userId: req.user!.id,
            id: { not: req.params.id },
          },
          orderBy: { createdAt: "desc" },
        });

        if (anotherAddress) {
          await prisma.address.update({
            where: { id: anotherAddress.id },
            data: { isDefault: true },
          });
        }
      }

      await prisma.address.delete({
        where: { id: req.params.id },
      });

      // Return 204 No Content for successful deletion
      res.status(204).end();
    } catch (err) {
      console.error("Failed to delete address:", err);
      res.status(500).json({
        success: false,
        error: "Failed to delete address",
      });
    }
  }
);

// Set default address
router.patch(
  "/:id/set-default",
  requireAuth,
  [param("id").isUUID().withMessage("Invalid address ID")],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // Verify address exists and belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!existingAddress) {
        return res.status(404).json({
          success: false,
          error: "Address not found",
        });
      }

      // Transaction to ensure atomic update
      const [_, defaultAddress] = await prisma.$transaction([
        // Reset all other addresses to non-default
        prisma.address.updateMany({
          where: {
            userId: req.user!.id,
            isDefault: true,
            id: { not: req.params.id },
          },
          data: { isDefault: false },
        }),
        // Set this address as default
        prisma.address.update({
          where: { id: req.params.id },
          data: { isDefault: true },
          select: {
            id: true,
            street: true,
            city: true,
            state: true,
            country: true,
            postalCode: true,
            phone: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      res.json({
        success: true,
        data: defaultAddress,
        message: "Default address updated successfully",
      });
    } catch (err) {
      console.error("Failed to set default address:", err);
      res.status(500).json({
        success: false,
        error: "Failed to set default address",
      });
    }
  }
);

export default router;
