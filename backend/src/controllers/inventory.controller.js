const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const prisma = new PrismaClient();

// ── Auth ──────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['owner', 'staff']).optional(),
});

exports.register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const password_hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password_hash, role: data.role || 'staff' },
      select: { id: true, name: true, email: true, role: true },
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(user);
  } catch (err) { next(err); }
};

// ── Inventory Items ───────────────────────────

const itemSchema = z.object({
  name: z.string().min(1),
  unit: z.enum(['kg', 'L', 'pcs', 'g', 'ml']),
  caution_level: z.number().min(0).optional(),
  category: z.string().optional(),
});

exports.listItems = async (_req, res, next) => {
  try {
    const items = await prisma.inventoryItem.findMany({ orderBy: { name: 'asc' } });
    res.json(items);
  } catch (err) { next(err); }
};

exports.createItem = async (req, res, next) => {
  try {
    const data = itemSchema.parse(req.body);
    const item = await prisma.inventoryItem.create({ data });
    res.status(201).json(item);
  } catch (err) { next(err); }
};

exports.getItem = async (req, res, next) => {
  try {
    const item = await prisma.inventoryItem.findUniqueOrThrow({ where: { id: +req.params.id } });
    res.json(item);
  } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const data = itemSchema.partial().parse(req.body);
    const item = await prisma.inventoryItem.update({ where: { id: +req.params.id }, data });
    res.json(item);
  } catch (err) { next(err); }
};

exports.deleteItem = async (req, res, next) => {
  try {
    await prisma.inventoryItem.delete({ where: { id: +req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.listBatches = async (req, res, next) => {
  try {
    const batches = await prisma.stockBatch.findMany({
      where: { item_id: +req.params.id },
      orderBy: { expiry_date: 'asc' },
      include: { vendor: true },
    });
    res.json(batches);
  } catch (err) { next(err); }
};

// ── Manual Delivery ───────────────────────────

const deliverySchema = z.object({
  item_id: z.number().int(),
  vendor_id: z.number().int(),
  quantity_received: z.number().positive(),
  expiry_date: z.string().datetime().optional(),
  unit_price: z.number().positive().optional(),
});

exports.addDelivery = async (req, res, next) => {
  try {
    const data = deliverySchema.parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.stockBatch.create({
        data: {
          item_id: data.item_id,
          vendor_id: data.vendor_id,
          quantity_received: data.quantity_received,
          quantity_remaining: data.quantity_received,
          expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
          unit_price: data.unit_price,
        },
      });
      await tx.inventoryItem.update({
        where: { id: data.item_id },
        data: { current_stock: { increment: data.quantity_received } },
      });
      await tx.stockMovement.create({
        data: {
          item_id: data.item_id,
          batch_id: batch.id,
          change_qty: data.quantity_received,
          movement_type: 'purchase',
          reference_id: `batch-${batch.id}`,
        },
      });
      return batch;
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

// ── Vendors ───────────────────────────────────

const vendorSchema = z.object({
  name: z.string().min(1),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  address: z.string().optional(),
});

exports.listVendors   = async (_req, res, next) => {
  try { res.json(await prisma.vendor.findMany({ orderBy: { name: 'asc' } })); }
  catch (err) { next(err); }
};

exports.createVendor  = async (req, res, next) => {
  try { res.status(201).json(await prisma.vendor.create({ data: vendorSchema.parse(req.body) })); }
  catch (err) { next(err); }
};

exports.updateVendor  = async (req, res, next) => {
  try { res.json(await prisma.vendor.update({ where: { id: +req.params.id }, data: vendorSchema.partial().parse(req.body) })); }
  catch (err) { next(err); }
};

exports.deleteVendor  = async (req, res, next) => {
  try { await prisma.vendor.delete({ where: { id: +req.params.id } }); res.status(204).send(); }
  catch (err) { next(err); }
};