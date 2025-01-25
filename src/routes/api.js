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
    console.log("here");
    res.status(500).json({
      message: "Failed to generate access token.",
      success: false,
      data: { errorMessage: error },
    });
  }
});

// Middleware to validate incoming request data
function validatePushRequest(req, res, next) {
  const {
    accessToken,
    deviceToken,
    projectId,
    title,
    body,
    icon,
    data,
    serviceAccount,
  } = req.body;

  if (!accessToken && !serviceAccount) {
    return res.status(400).json({
      message: "Provide either an accessToken or a service account file.",
    });
  }

  // Check for projectId if accessToken is provided
  if (accessToken && !projectId) {
    return res
      .status(400)
      .json({ message: "projectId is required when using accessToken." });
  }

  if (!deviceToken || typeof deviceToken !== "string") {
    return res.status(400).json({ message: "Invalid or missing deviceToken." });
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
  let {
    accessToken,
    projectId,
    deviceToken,
    title,
    body,
    icon,
    data,
    serviceAccount
  } = req.body;

  try {
    if (serviceAccount) {
      accessToken = await FirebaseHelper.generateAccessToken(serviceAccount);
      projectId = serviceAccount.project_id;
    }

    // If using access token, call FCM API directly
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const fcmMessage = {
      message: {
        notification: { title, body },
        data: { ...data, icon } || {},
        token: deviceToken.split(",").map((t) => t.trim())[0], // Only one token at a time for FCM
      },
    };

    const fcmResponse = await fetch(fcmEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fcmMessage),
    });

    const responseData = await fcmResponse.json();
    console.log(responseData);
    
    if (!fcmResponse.ok) {
      throw new Error(
        `FCM API Error: ${responseData.error.message || "Unknown error"}`
      );
    }

    return res
      .status(200)
      .json({ message: "Notification sent via FCM API.", success: true });
  } catch (error) {
    console.error("Error:", error);

    return res.status(500).json({
      message: `Failed to send notification. : ${error?.message}`,
      success: false,
      data: { errorMessage: error.message },
    });
  }
});

module.exports = router;
