const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  stock: { type: Number, default: 0 }
});
module.exports = mongoose.model('Product', productSchema);