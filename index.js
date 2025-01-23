const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware to serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Route to serve the HTML file
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
