const express = require("express");
const router = express.Router();
const path = require("path");

// Route to serve the HTML file
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "view", "index.html"));
});

// Route to serve the HTML file
router.get("/generate-device-token", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "view", "web-push.html"));
});

router.get("/blog", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "view", "blog.html"));
});

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "view", "index.html"));
});

router.get(/.*/, (req, res) => {
  res.redirect("/");
});

module.exports = router;
