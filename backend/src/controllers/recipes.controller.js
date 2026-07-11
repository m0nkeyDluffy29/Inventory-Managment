const { z } = require("zod");
const prisma = require("../lib/prisma");

const dishSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string().optional(),
});

exports.listDishes = async (_req, res, next) => {
  try {
    res.json(await prisma.dish.findMany({ orderBy: { name: "asc" } }));
  } catch (err) {
    next(err);
  }
};
exports.createDish = async (req, res, next) => {
  try {
    res
      .status(201)
      .json(await prisma.dish.create({ data: dishSchema.parse(req.body) }));
  } catch (err) {
    next(err);
  }
};
exports.updateDish = async (req, res, next) => {
  try {
    res.json(
      await prisma.dish.update({
        where: { id: +req.params.id },
        data: dishSchema.partial().parse(req.body),
      }),
    );
  } catch (err) {
    next(err);
  }
};
exports.deleteDish = async (req, res, next) => {
  try {
    await prisma.dish.delete({ where: { id: +req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
exports.getRecipe = async (req, res, next) => {
  try {
    res.json(
      await prisma.recipe.findMany({
        where: { dish_id: +req.params.id },
        include: { item: true },
      }),
    );
  } catch (err) {
    next(err);
  }
};

const recipeSchema = z.array(
  z.object({
    item_id: z.number().int(),
    quantity_required: z.number().positive(),
  }),
);

exports.setRecipe = async (req, res, next) => {
  try {
    const lines = recipeSchema.parse(req.body);
    const dish_id = +req.params.id;
    const result = await prisma.$transaction(async (tx) => {
      await tx.recipe.deleteMany({ where: { dish_id } });
      return tx.recipe.createMany({
        data: lines.map((l) => ({ dish_id, ...l })),
      });
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
