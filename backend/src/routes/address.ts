import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { requireAuth, AuthenticatedRequest } from "../middlewares/requireAuth";
import { body, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware for address data
const validateAddress = [
  body("street").trim().notEmpty().withMessage("Street address is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("state").trim().notEmpty().withMessage("State/Province is required"),
  body("country").trim().notEmpty().withMessage("Country is required"),
  body("postalCode")
    .trim()
    .notEmpty()
    .withMessage("Postal/ZIP code is required")
    .isPostalCode("any")
    .withMessage("Invalid postal code format"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("any")
    .withMessage("Invalid phone number format"),
];

// Get all addresses for the authenticated user
router.get("/", requireAuth, async (req: AuthenticatedRequest, res:Response) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
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
  async (req: AuthenticatedRequest, res:Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

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
        res.status(404).json({
          success: false,
          error: "Address not found",
        });
        return;
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
  async (req: AuthenticatedRequest, res:Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    try {
      // If this is the first address, set it as default
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
  [
    param("id").isUUID().withMessage("Invalid address ID"),
    ...validateAddress,
  ],
  async (req: AuthenticatedRequest, res:Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    try {
      // Verify address exists and belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: { 
          id: req.params.id,
          userId: req.user!.id 
        },
      });

      if (!existingAddress) {
        res.status(404).json({
          success: false,
          error: "Address not found",
        });
        return;
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
  async (req: AuthenticatedRequest, res:Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    try {
      // Verify address exists and belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: { 
          id: req.params.id,
          userId: req.user!.id 
        },
      });

      if (!existingAddress) {
        res.status(404).json({
          success: false,
          error: "Address not found",
        });
        return;
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
  async (req: AuthenticatedRequest, res:Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    try {
      // Verify address exists and belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: { 
          id: req.params.id,
          userId: req.user!.id 
        },
      });

      if (!existingAddress) {
        res.status(404).json({
          success: false,
          error: "Address not found",
        });
        return;
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