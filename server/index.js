const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next()
}
)

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/clients', require('./routes/client.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/stock', require('./routes/stock.routes'));
app.use('/api/suppliers', require('./routes/supplier.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/lots', require('./routes/lot.routes'));
app.use('/api/receptions', require('./routes/reception.routes'));
app.use('/api/settings', require('./routes/settings.routes'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
