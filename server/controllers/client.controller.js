const Client = require('../models/Client');

const getClients = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search
      ? { $or: [{ fullName: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }] }
      : {};
    const clients = await Client.find(filter).sort({ createdAt: -1 });
    res.json(clients);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const normalizePhone = (phone) => {
  if (phone === undefined || phone === null) return null;
  const trimmed = String(phone).trim();
  return trimmed === '' ? null : trimmed;
};

const createClient = async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    if (!fullName) return res.status(400).json({ message: 'fullName is required' });

    const client = await Client.create({
      fullName,
      phone: normalizePhone(req.body.phone),
      loyaltyPoints: req.body.loyaltyPoints ?? 0,
    });
    res.status(201).json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    if (req.body.fullName !== undefined) {
      const fullName = String(req.body.fullName).trim();
      if (!fullName) return res.status(400).json({ message: 'fullName is required' });
      client.fullName = fullName;
    }
    if (req.body.phone !== undefined) {
      client.phone = normalizePhone(req.body.phone);
    }
    // loyaltyPoints are system-managed later; ignore client edits for now unless admin passes them
    if (req.body.loyaltyPoints !== undefined) {
      client.loyaltyPoints = Number(req.body.loyaltyPoints) || 0;
    }

    await client.save();
    res.json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient };
