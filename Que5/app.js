const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Employee = require("./models/Employee");
const Leave = require("./models/Leave");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/erp");

const JWT_SECRET = "employee_secret";

// JWT Middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.empid = decoded.empid;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Login
app.post("/api/login", async (req, res) => {
  const { empid, password } = req.body;
  const employee = await Employee.findOne({ empid });
  if (employee && (await bcrypt.compare(password, employee.password))) {
    const token = jwt.sign({ empid }, JWT_SECRET);
    res.json({ token, employee: { empid, name: employee.name, email: employee.email } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Get Profile
app.get("/api/profile", auth, async (req, res) => {
  const employee = await Employee.findOne({ empid: req.empid });
  res.json(employee);
});

// Apply Leave
app.post("/api/leave", auth, async (req, res) => {
  const { date, reason } = req.body;
  const leave = new Leave({ empid: req.empid, date, reason });
  await leave.save();
  res.json({ message: "Leave applied" });
});

// Get Leaves
app.get("/api/leaves", auth, async (req, res) => {
  const leaves = await Leave.find({ empid: req.empid });
  res.json(leaves);
});

// Logout (client-side token removal)
app.post("/api/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

app.listen(3001, () => console.log("Employee site running on http://localhost:3001"));