async function deductStockFIFO(tx, dish, dishQty, orderId) {
  for (const recipeRow of dish.recipes) {
    let needed = recipeRow.quantity_required * dishQty;

    const batches = await tx.stockBatch.findMany({
      where: { item_id: recipeRow.item_id, quantity_remaining: { gt: 0 } },
      orderBy: [{ expiry_date: "asc" }, { received_date: "asc" }],
    });

    for (const batch of batches) {
      if (needed <= 0) break;
      const deduct = Math.min(batch.quantity_remaining, needed);
      needed -= deduct;

      await tx.stockBatch.update({
        where: { id: batch.id },
        data: { quantity_remaining: { decrement: deduct } },
      });
      await tx.stockMovement.create({
        data: {
          item_id: recipeRow.item_id,
          batch_id: batch.id,
          change_qty: -deduct,
          movement_type: "sale",
          reference_id: `order-${orderId}`,
        },
      });
    }

    if (needed > 0)
      throw new Error(
        `Insufficient stock for "${recipeRow.item.name}": short by ${needed} ${recipeRow.item.unit}`,
      );

    await tx.inventoryItem.update({
      where: { id: recipeRow.item_id },
      data: {
        current_stock: { decrement: recipeRow.quantity_required * dishQty },
      },
    });
  }
}

module.exports = { deductStockFIFO };
