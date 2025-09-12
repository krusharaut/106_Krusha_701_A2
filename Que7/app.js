const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const Category = require("./models/Category");
const Product = require("./models/Product");
const Cart = require("./models/Cart");

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({ secret: "shop", resave: false, saveUninitialized: true }));

mongoose.connect("mongodb://localhost:27017/shop");

// Admin Routes
app.get("/admin", async (req, res) => {
  const categories = await Category.find().populate('parent');
  const products = await Product.find().populate('category');
  res.render("admin", { categories, products });
});

app.post("/admin/category", async (req, res) => {
  const { name, parent } = req.body;
  await Category.create({ name, parent: parent || null });
  res.redirect("/admin");
});

app.post("/admin/product", async (req, res) => {
  const { name, price, category, stock } = req.body;
  await Product.create({ name, price, category, stock });
  res.redirect("/admin");
});

// User Routes
app.get("/", async (req, res) => {
  const categories = await Category.find({ parent: null });
  const products = await Product.find().populate('category');
  const cart = await Cart.findOne({ sessionId: req.sessionID }).populate('items.product');
  res.render("shop", { categories, products, cart });
});

app.get("/category/:id", async (req, res) => {
  const category = await Category.findById(req.params.id);
  const subcategories = await Category.find({ parent: req.params.id });
  const products = await Product.find({ category: req.params.id }).populate('category');
  const cart = await Cart.findOne({ sessionId: req.sessionID }).populate('items.product');
  res.render("category", { category, subcategories, products, cart });
});

app.post("/cart/add", async (req, res) => {
  const { productId } = req.body;
  let cart = await Cart.findOne({ sessionId: req.sessionID });
  if (!cart) {
    cart = new Cart({ sessionId: req.sessionID, items: [] });
  }
  const existingItem = cart.items.find(item => item.product.toString() === productId);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.items.push({ product: productId, quantity: 1 });
  }
  await cart.save();
  res.redirect("/");
});

app.get("/cart", async (req, res) => {
  const cart = await Cart.findOne({ sessionId: req.sessionID }).populate('items.product');
  res.render("cart", { cart });
});

app.listen(3002, () => console.log("Shopping cart running on http://localhost:3002"));