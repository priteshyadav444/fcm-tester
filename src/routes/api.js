const express = require("express");
const router = express.Router();
const FirebaseHelper = require("../util/firebaseHelper");

// API to generate a custom Firebase token
router.post("/generate-access-token", async (req, res) => {
  try {
    if (req.body) {
      try {
        serviceAccount = req.body; // Parse JSON from a JSON string payload
      } catch (error) {
        return res.status(400).json({
          message: "Invalid JSON format in serviceAccountJSON.",
          success: false,
        });
      }
    } else {
      return res.status(400).json({
        message:
          "Please provide a valid service account file content or JSON payload.",
        success: false,
      });
    }

    // Generate access token using the helper class
    const accessToken = await FirebaseHelper.generateAccessToken(
      serviceAccount
    );

    res.status(200).json({
      message: "Access token generated successfully.",
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    console.error("Error generating access token:", error);
    res.status(500).json({
      message: "Failed to generate access token.",
      success: false,
      data: { errorMessage: error.message },
    });
  }
});

// Middleware to validate incoming request data
function validatePushRequest(req, res, next) {
  const { access_token, device_token, project_id, title, body, icon, data } =
    req.body;

  if (!access_token && !req.file) {
    return res.status(400).json({
      message: "Provide either an access_token or a service account file.",
    });
  }

  if (access_token && !req.file && !project_id) {
    return res.status(400).json({
      message:
        "Provide project_id while sending push notification using access_token",
    });
  }

  if (!device_token || typeof device_token !== "string") {
    return res
      .status(400)
      .json({ message: "Invalid or missing device_token." });
  }
  if (!title || typeof title !== "string") {
    return res.status(400).json({ message: "Invalid or missing title." });
  }
  if (!body || typeof body !== "string") {
    return res.status(400).json({ message: "Invalid or missing body." });
  }
  if (icon && typeof icon !== "string") {
    return res.status(400).json({ message: "Invalid icon format." });
  }
  if (data && typeof data !== "object") {
    return res
      .status(400)
      .json({ message: "Invalid data format. Must be an object." });
  }

  next();
}

router.post("/initiate-notification", validatePushRequest, async (req, res) => {
  const { access_token, project_id, device_token, title, body, icon, data } =
    req.body;
  let serviceAccountPath = null;

  try {
    // Check for project_id if access_token is provided
    if (access_token && !project_id) {
      return res
        .status(400)
        .json({ message: "project_id is required when using access_token." });
    }

    if (req.file) {
      // If service account file is uploaded, use it
      serviceAccountPath = path.resolve(req.file.path);
      admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
      });

      const message = {
        notification: { title, body },
        data: data || {},
        tokens: device_token.split(",").map((t) => t.trim()), // Multiple tokens
      };

      const response = await admin.messaging().sendMulticast(message);

      // Clean up uploaded file
      fs.unlinkSync(serviceAccountPath);
      return res
        .status(200)
        .json({ message: "Notifications sent successfully.", data: response });
    } else if (access_token) {
      // If using access token, call FCM API directly
      const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${project_id}/messages:send`;
      const fcmMessage = {
        message: {
          notification: { title, body },
          data: { ...data, icon } || {},
          token: device_token.split(",").map((t) => t.trim())[0], // Only one token at a time for FCM
        },
      };
      console.log(fcmEndpoint, fcmMessage);

      const fcmResponse = await fetch(fcmEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fcmMessage),
      });

      const responseData = await fcmResponse.json();

      if (!fcmResponse.ok) {
        throw new Error(
          `FCM API Error: ${responseData.error.message || "Unknown error"}`
        );
      }

      return res
        .status(200)
        .json({ message: "Notification sent via FCM API.", responseData });
    }
  } catch (error) {
    console.error("Error:", error);
    // Clean up uploaded file if it exists
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      fs.unlinkSync(serviceAccountPath);
    }

    return res.status(500).json({
      message: "Failed to send notification.",
      success: false,
      data: { errorMessage: error.message },
    });
  }
});

module.exports = router;
