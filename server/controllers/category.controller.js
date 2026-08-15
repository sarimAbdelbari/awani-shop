const Category = require('../models/Category');

const CODE_RE = /^[A-Z]{3}$/;

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const createCategory = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const code = normalizeCode(req.body.code);

    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!CODE_RE.test(code))
      return res.status(400).json({ message: 'Code must be exactly 3 letters (A-Z)' });

    const existsName = await Category.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
    if (existsName) return res.status(409).json({ message: 'Category name already exists' });

    const existsCode = await Category.findOne({ code });
    if (existsCode) return res.status(409).json({ message: 'Category code already exists' });

    const category = await Category.create({ name, code, nextProductSeq: 1 });
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Code is locked after create (product codes depend on it)
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: 'Name is required' });
      const existsName = await Category.findOne({
        _id: { $ne: category._id },
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      });
      if (existsName) return res.status(409).json({ message: 'Category name already exists' });
      category.name = name;
    }

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const Product = require('../models/Product');
    const inUse = await Product.exists({ category: req.params.id });
    if (inUse)
      return res.status(400).json({ message: 'Cannot delete category with products' });

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
