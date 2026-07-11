// backend/src/prisma/seed.js
const bcrypt = require("bcrypt");
const prisma = require('../lib/prisma')

async function main() {
  // Owner account
  await prisma.user.upsert({
    where: { email: "owner@restaurant.com" },
    update: {},
    create: {
      name: "Owner",
      email: "owner@restaurant.com",
      password_hash: await bcrypt.hash("password123", 10),
      role: "owner",
    },
  });

  // Sample vendor
  const vendor = await prisma.vendor.create({
    data: { name: "Fresh Farms", contact_phone: "9876543210" },
  });

  // Sample inventory items
  const tomato = await prisma.inventoryItem.create({
    data: {
      name: "Tomatoes",
      unit: "kg",
      caution_level: 5,
      category: "Vegetables",
    },
  });
  const onion = await prisma.inventoryItem.create({
    data: {
      name: "Onions",
      unit: "kg",
      caution_level: 3,
      category: "Vegetables",
    },
  });
  const rice = await prisma.inventoryItem.create({
    data: { name: "Rice", unit: "kg", caution_level: 10, category: "Grains" },
  });

  // Sample dish + recipe
  const dish = await prisma.dish.create({
    data: { name: "Tomato Rice", price: 120, category: "Main Course" },
  });
  await prisma.recipe.createMany({
    data: [
      { dish_id: dish.id, item_id: tomato.id, quantity_required: 0.2 },
      { dish_id: dish.id, item_id: rice.id, quantity_required: 0.15 },
    ],
  });

  console.log("✅ Seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
