const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");
const { deductStockFIFO } = require("../services/stockDeduction.service");

const prisma = new PrismaClient();

const orderSchema = z.object({
  table_or_customer_ref: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        dish_id: z.number().int(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

exports.listOrders = async (_req, res, next) => {
  try {
    res.json(
      await prisma.order.findMany({
        include: { lineItems: { include: { dish: true } } },
        orderBy: { created_at: "desc" },
      }),
    );
  } catch (err) {
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const data = orderSchema.parse(req.body);
    const dishIds = data.lineItems.map((l) => l.dish_id);
    const dishes = await prisma.dish.findMany({
      where: { id: { in: dishIds } },
      include: { recipes: { include: { item: true } } },
    });
    if (dishes.length !== new Set(dishIds).size)
      return res.status(400).json({ error: "One or more dish IDs not found" });

    const total_amount = data.lineItems.reduce((sum, li) => {
      const dish = dishes.find((d) => d.id === li.dish_id);
      return sum + dish.price * li.quantity;
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          total_amount,
          table_or_customer_ref: data.table_or_customer_ref,
          lineItems: { create: data.lineItems },
        },
      });
      for (const li of data.lineItems) {
        const dish = dishes.find((d) => d.id === li.dish_id);
        await deductStockFIFO(tx, dish, li.quantity, newOrder.id);
      }
      return newOrder;
    });

    res.status(201).json(
      await prisma.order.findUnique({
        where: { id: order.id },
        include: { lineItems: { include: { dish: true } } },
      }),
    );
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    res.json(
      await prisma.order.findUniqueOrThrow({
        where: { id: +req.params.id },
        include: { lineItems: { include: { dish: true } } },
      }),
    );
  } catch (err) {
    next(err);
  }
};
