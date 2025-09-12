import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  try {
    const response = await fetch("https://catfact.ninja/fact");
    const data = await response.json();
    res.render("index", { fact: data.fact });
  } catch (error) {
    res.render("index", { fact: "Error fetching cat fact" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
