const Product = require('../models/Product');
const Category = require('../models/Category');

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const activeNameFilter = (name, excludeId) => {
  const filter = {
    isActive: true,
    name: new RegExp(`^${escapeRegex(String(name).trim())}$`, 'i'),
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return filter;
};

const getProducts = async (req, res) => {
  try {
    const { search, category, active = 'true' } = req.query;
    const filter = {};

    if (active === 'true') filter.isActive = true;
    else if (active === 'false') filter.isActive = false;
    // active=all → no isActive filter

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { qrCode: new RegExp(search, 'i') },
        { code: new RegExp(search, 'i') },
      ];
    }
    if (category) filter.category = category;

    const products = await Product.find(filter)
      .populate('category', 'name code')
      .sort({ code: 1 });
    res.json(products);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name code');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const createProduct = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const qrCode = String(req.body.qrCode || '').trim();
    const categoryId = req.body.category;

    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!categoryId) return res.status(400).json({ message: 'Category is required' });

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const nameTaken = await Product.findOne(activeNameFilter(name));
    if (nameTaken)
      return res.status(409).json({ message: 'An active product with this name already exists' });

    const seq = category.nextProductSeq;
    const code = `${category.code}${String(seq).padStart(4, '0')}`;

    const product = await Product.create({
      code,
      name,
      qrCode,
      category: category._id,
      isActive: true,
    });

    category.nextProductSeq = seq + 1;
    await category.save();

    const populated = await Product.findById(product._id).populate('category', 'name code');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.body.category !== undefined && String(req.body.category) !== String(product.category)) {
      return res.status(400).json({ message: 'Category cannot be changed' });
    }
    if (req.body.code !== undefined && req.body.code !== product.code) {
      return res.status(400).json({ message: 'Product code cannot be changed' });
    }

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: 'Name is required' });

      if (product.isActive) {
        const nameTaken = await Product.findOne(activeNameFilter(name, product._id));
        if (nameTaken)
          return res.status(409).json({ message: 'An active product with this name already exists' });
      }
      product.name = name;
    }

    if (req.body.qrCode !== undefined) {
      product.qrCode = String(req.body.qrCode).trim();
    }

    await product.save();
    const populated = await Product.findById(product._id).populate('category', 'name code');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deactivateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!product.isActive) return res.json(product);

    product.isActive = false;
    await product.save();
    const populated = await Product.findById(product._id).populate('category', 'name code');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const activateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.isActive) return res.json(product);

    const nameTaken = await Product.findOne(activeNameFilter(product.name, product._id));
    if (nameTaken)
      return res.status(409).json({
        message: 'Cannot activate: an active product with this name already exists',
      });

    product.isActive = true;
    await product.save();
    const populated = await Product.findById(product._id).populate('category', 'name code');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    // Prefer soft-delete via deactivate; hard delete still available for admin cleanup
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deactivateProduct,
  activateProduct,
  deleteProduct,
};
