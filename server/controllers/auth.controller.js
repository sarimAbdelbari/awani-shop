const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      token: signToken(user),
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// One-time setup: creates the first admin account when no users exist
const setupAdmin = async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count > 0)
      return res.status(403).json({ message: 'Admin already configured' });

    const { name, username, password } = req.body;
    if (!name || !username || !password)
      return res.status(400).json({ message: 'name, username, and password are required' });

    const user = await User.create({ name, username, password, role: 'admin' });
    res.status(201).json({
      token: signToken(user),
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password)
      return res.status(400).json({ message: 'name, username, and password are required' });

    const exists = await User.findOne({ username });
    if (exists)
      return res.status(409).json({ message: 'Username already taken' });

    const user = await User.create({ name, username, password, role: role || 'cashier' });
    res.status(201).json({ id: user._id, name: user.name, username: user.username, role: user.role });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ message: 'Cannot delete your own account' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = (req, res) => res.json(req.user);

module.exports = { login, setupAdmin, createUser, getUsers, deleteUser, getMe };
