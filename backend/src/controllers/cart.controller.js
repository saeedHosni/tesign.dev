// src/controllers/cart.controller.js
import prisma from '../config/db.js';

const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, price: true, icon: true, stock: true },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: { items: { include: { product: true } } },
    });
  }

  return cart;
};

const formatCart = (cart) => {
  const subtotal = cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  return {
    id: cart.id,
    items: cart.items,
    itemCount: cart.items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
  };
};

// GET /api/cart
export const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    res.json({ success: true, data: formatCart(cart) });
  } catch (error) {
    next(error);
  }
};

// POST /api/cart/add
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    }

    // Check stock (digital products have stock = -1 = unlimited)
    if (product.stock !== -1 && product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'موجودی کافی نیست.' });
    }

    const cart = await getOrCreateCart(req.user.id);

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + Number(quantity) },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity: Number(quantity) },
      });
    }

    const updatedCart = await getOrCreateCart(req.user.id);
    res.json({ success: true, message: 'به سبد خرید اضافه شد.', data: formatCart(updatedCart) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/cart/item/:itemId
export const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'تعداد باید حداقل ۱ باشد.' });
    }

    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) return res.status(404).json({ success: false, message: 'سبد خرید یافت نشد.' });

    await prisma.cartItem.updateMany({
      where: { id: req.params.itemId, cartId: cart.id },
      data: { quantity: Number(quantity) },
    });

    const updatedCart = await getOrCreateCart(req.user.id);
    res.json({ success: true, data: formatCart(updatedCart) });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/item/:itemId
export const removeFromCart = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) return res.status(404).json({ success: false, message: 'سبد خرید یافت نشد.' });

    await prisma.cartItem.deleteMany({
      where: { id: req.params.itemId, cartId: cart.id },
    });

    const updatedCart = await getOrCreateCart(req.user.id);
    res.json({ success: true, message: 'از سبد خرید حذف شد.', data: formatCart(updatedCart) });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/clear
export const clearCart = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    res.json({ success: true, message: 'سبد خرید پاک شد.' });
  } catch (error) {
    next(error);
  }
};
