const express = require("express");
const path = require("path");
require("dotenv").config();
const functions = require("firebase-functions");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "..", "public")));

// Route to serve the HTML file
app.get("/generate-device-token", (req, res) => {
  console.log("asdasd");
  res.sendFile(path.join(__dirname, "..", "public", "web-push.html"));
});

app.get("/test", (req, res) => {
  res.send("The /test route is working!");
});

// Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running at http://localhost:${PORT}`);
// });

if (process.env.APP_ENV == "local") {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

if (process.env.APP_ENV == "production") {
  exports.api = functions.https.onRequest(app);
}
