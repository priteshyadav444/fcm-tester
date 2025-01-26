const express = require("express");
const path = require("path");
require("dotenv").config();
const functions = require("firebase-functions");
const rateLimit = require("express-rate-limit");
const webRoutes = require("./routes/web");
const apiRoutes = require("./routes/api"); 
var compression = require('compression')


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" })); // Sets the max JSON payload size to 2MB
app.use(express.urlencoded({ extended: true, limit: "2mb" })); // Handles URL-encoded data with the same limit
// Error handler for payload size issues
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: "Payload too large. Please reduce the file or payload size.",
    });
  }
  next(err);
});

// Rate limiting middleware: Maximum 60 requests per minute from an IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per `window` (here, per minute)
  message: "Too many requests, please try again after a minute.",
});
app.use(limiter);


// Middleware to serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "..", "public")));

// Middleware for parsing JSON requests
app.use(express.json());

app.use(compression())


// Use the routes from the external file
app.use("/api", apiRoutes);
app.use("/", webRoutes);

// Start the server for local development
if (process.env.APP_ENV == "local") {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

// Firebase Functions setup for production
if (process.env.APP_ENV == "production") {
  exports.api = functions.https.onRequest(app);
}
