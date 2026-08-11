const Order = require('../models/Order');
const Product = require('../models/Product');
const Client = require('../models/Client');
const StockMovement = require('../models/StockMovement');
const Settings = require('../models/Settings');

const getOrders = async (req, res) => {
  try {
    const { client, from, to } = req.query;
    const filter = {};
    if (client) filter.client = client;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const orders = await Order.find(filter)
      .populate('client', 'fullName phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client', 'fullName phone loyaltyPoints')
      .populate('createdBy', 'name')
      .populate('items.product', 'name qrCode sellPrice');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const createOrder = async (req, res) => {
  try {
    const { clientId, items, note } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: 'Order must have at least one item' });

    // Fetch and validate all products in one query
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

    for (const item of items) {
      const product = productMap[item.productId];
      if (!product)
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      if (product.quantity < item.qty)
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.quantity}`,
        });
    }

    // Build line items with calculated totals
    const orderItems = items.map((item) => {
      const product = productMap[item.productId];
      const discount = Number(item.discount) || 0;
      const unitPrice = product.sellPrice;
      const lineTotal = parseFloat((unitPrice * item.qty * (1 - discount / 100)).toFixed(2));
      return { product: item.productId, qty: item.qty, unitPrice, discount, lineTotal };
    });

    const subtotal = parseFloat(
      orderItems.reduce((sum, i) => sum + i.unitPrice * i.qty, 0).toFixed(2)
    );
    const discountTotal = parseFloat(
      (subtotal - orderItems.reduce((sum, i) => sum + i.lineTotal, 0)).toFixed(2)
    );
    const total = parseFloat((subtotal - discountTotal).toFixed(2));

    const order = await Order.create({
      client: clientId || null,
      items: orderItems,
      subtotal,
      discountTotal,
      total,
      createdBy: req.user.id,
      note: note || '',
    });

    // Deduct stock and create movement records concurrently
    await Promise.all(
      orderItems.map((item) =>
        Promise.all([
          Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.qty } }),
          StockMovement.create({
            product: item.product,
            type: 'out',
            quantity: item.qty,
            source: 'order',
            referenceId: order._id,
          }),
        ])
      )
    );

    // Update client loyalty points if client is attached
    if (clientId) {
      const [settings, client] = await Promise.all([
        Settings.getSingleton(),
        Client.findById(clientId),
      ]);
      if (client) {
        const previousThresholds = Math.floor(client.totalSpent / settings.loyaltyThreshold);
        const newThresholds = Math.floor((client.totalSpent + total) / settings.loyaltyThreshold);
        const rewardsEarned = (newThresholds - previousThresholds) * settings.loyaltyReward;
        await Client.findByIdAndUpdate(clientId, {
          $inc: { totalSpent: total, loyaltyPoints: rewardsEarned },
        });
      }
    }

    const populated = await Order.findById(order._id)
      .populate('client', 'fullName phone')
      .populate('createdBy', 'name')
      .populate('items.product', 'name qrCode');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Stats used by dashboard
const getStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [recentOrders, totalClients, lowStockProducts] = await Promise.all([
      Order.find({ createdAt: { $gte: thirtyDaysAgo } }).select('total items createdAt'),
      require('../models/Client').countDocuments(),
      require('../models/Product').find().then((products) =>
        products.filter((p) => p.quantity <= p.lowStockThreshold).length
      ),
    ]);

    const revenue30d = recentOrders.reduce((sum, o) => sum + o.total, 0);

    // Daily revenue for chart (last 30 days)
    const dailyMap = {};
    recentOrders.forEach((order) => {
      const day = order.createdAt.toISOString().slice(0, 10);
      dailyMap[day] = (dailyMap[day] || 0) + order.total;
    });
    const dailyRevenue = Object.entries(dailyMap)
      .map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top 5 products by quantity sold
    const productSales = {};
    recentOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.product.toString();
        productSales[key] = (productSales[key] || 0) + item.qty;
      });
    });
    const topProductIds = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
    const topProducts = await require('../models/Product')
      .find({ _id: { $in: topProductIds } })
      .select('name')
      .then((ps) =>
        ps.map((p) => ({ name: p.name, qty: productSales[p._id.toString()] }))
          .sort((a, b) => b.qty - a.qty)
      );

    res.json({
      revenue30d: parseFloat(revenue30d.toFixed(2)),
      orders30d: recentOrders.length,
      totalClients,
      lowStockCount: lowStockProducts,
      dailyRevenue,
      topProducts,
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getOrders, getOrder, createOrder, getStats };
