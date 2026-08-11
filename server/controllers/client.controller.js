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

const createClient = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
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
