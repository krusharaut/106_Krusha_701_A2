const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Employee = require("./models/Employee");

const app = express();

// DB connect
mongoose.connect("mongodb://127.0.0.1:27017/erp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middlewares
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));

// Fake admin
const ADMIN = { username: "admin", password: "123" };

// Routes
app.get("/", (req, res) => res.render("login"));
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    req.session.admin = true;
    return res.redirect("/dashboard");
  }
  res.send("Invalid Admin Credentials");
});

app.get("/dashboard", (req, res) => {
  if (!req.session.admin) return res.redirect("/");
  res.render("dashboard");
});

app.get("/employees", async (req, res) => {
  if (!req.session.admin) return res.redirect("/");
  const employees = await Employee.find();
  res.render("employees", { employees });
});

app.get("/employees/add", (req, res) => {
  if (!req.session.admin) return res.redirect("/");
  res.render("addEmployee");
});

app.post("/employees/add", async (req, res) => {
  const { name, email, salary } = req.body;

  const empId = "EMP" + Date.now(); // simple ID
  const plainPass = Math.random().toString(36).slice(-6); // random 6 char password
  const hashedPass = await bcrypt.hash(plainPass, 10);
  const sal = parseInt(salary) + 100;

  const employee = new Employee({
    empId,
    name,
    email,
    salary:sal,
    password: hashedPass,
  });
  await employee.save();

  // send email
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: "jayvekariya014@gmail.com", pass: "jqhe lzif llkm vqdz" },
  });
  await transporter.sendMail({
    from: "jayvekariya014@gmail.com",
    to: email,
    subject: "Welcome Employee",
    text: `Hello ${name}, your Employee ID is ${empId} and password is ${plainPass}`,
  });

  res.redirect("/employees");
});
// Edit Employee form
app.get("/employees/edit/:id", async (req, res) => {
  if (!req.session.admin) return res.redirect("/");
  const employee = await Employee.findById(req.params.id);
  res.render("editEmployee", { employee });
});

// Edit Employee logic
app.post("/employees/edit/:id", async (req, res) => {
  const { name, email, salary } = req.body;
  await Employee.findByIdAndUpdate(req.params.id, { name, email, salary });
  res.redirect("/employees");
});

// Delete Employee
app.get("/employees/delete/:id", async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.redirect("/employees");
});
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

app.listen(3000, () => console.log("run on 3000"));
