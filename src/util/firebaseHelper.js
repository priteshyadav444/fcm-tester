const { GoogleAuth } = require("google-auth-library");

class FirebaseHelper {
  static SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

  /**
   * Generates an access token using a service account.
   * @param {object|string} serviceAccount - Service account object or JSON string.
   * @returns {Promise<string>} - Returns the access token.
   */
  static async generateAccessToken(serviceAccount) {
    try {
      // Parse JSON string if serviceAccount is a string
      const credentials =
        typeof serviceAccount === "string"
          ? JSON.parse(serviceAccount)
          : serviceAccount;

      // Initialize Google Auth with credentials and scope
      const auth = new GoogleAuth({
        credentials,
        scopes: FirebaseHelper.SCOPES,
      });

      // Get the client and generate the access token
      const client = await auth.getClient();
      const accessTokenResponse = await client.getAccessToken();
      return accessTokenResponse.token;
    } catch (error) {
      throw new Error("Error generating access token: " + error.message);
    }
  }
}

module.exports = FirebaseHelper;
