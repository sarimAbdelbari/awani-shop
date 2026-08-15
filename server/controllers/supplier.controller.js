const Supplier = require('../models/Supplier');

const pickSupplierFields = (body) => ({
  fullName: body.fullName !== undefined ? String(body.fullName).trim() : undefined,
  phone: body.phone !== undefined ? String(body.phone).trim() : undefined,
  location: body.location !== undefined ? String(body.location).trim() : undefined,
  nif: body.nif !== undefined ? String(body.nif).trim() : undefined,
  nis: body.nis !== undefined ? String(body.nis).trim() : undefined,
  rc: body.rc !== undefined ? String(body.rc).trim() : undefined,
  email: body.email !== undefined ? String(body.email).trim().toLowerCase() : undefined,
});

const getSuppliers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search
      ? {
          $or: [
            { fullName: new RegExp(search, 'i') },
            { phone: new RegExp(search, 'i') },
            { nif: new RegExp(search, 'i') },
          ],
        }
      : {};
    const suppliers = await Supplier.find(filter).sort({ fullName: 1 });
    res.json(suppliers);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json(supplier);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const createSupplier = async (req, res) => {
  try {
    const fields = pickSupplierFields(req.body);
    if (!fields.fullName) return res.status(400).json({ message: 'fullName is required' });

    const supplier = await Supplier.create({
      fullName: fields.fullName,
      phone: fields.phone || '',
      location: fields.location || '',
      nif: fields.nif || '',
      nis: fields.nis || '',
      rc: fields.rc || '',
      email: fields.email || '',
    });
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    const fields = pickSupplierFields(req.body);
    if (fields.fullName !== undefined) {
      if (!fields.fullName) return res.status(400).json({ message: 'fullName is required' });
      supplier.fullName = fields.fullName;
    }
    if (fields.phone !== undefined) supplier.phone = fields.phone;
    if (fields.location !== undefined) supplier.location = fields.location;
    if (fields.nif !== undefined) supplier.nif = fields.nif;
    if (fields.nis !== undefined) supplier.nis = fields.nis;
    if (fields.rc !== undefined) supplier.rc = fields.rc;
    if (fields.email !== undefined) supplier.email = fields.email;

    await supplier.save();
    res.json(supplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };
