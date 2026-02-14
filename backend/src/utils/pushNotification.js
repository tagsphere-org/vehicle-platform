const admin = require('./firebase');
const features = require('../config/features');

/**
 * Send push notification to a user's registered devices
 * @param {Object} user - User document with fcmTokens
 * @param {Object} notification - { title, body, data }
 */
async function sendPush(user, { title, body, data = {} }) {
  if (!features.firebase || !admin) return;
  if (!user.fcmTokens || user.fcmTokens.length === 0) return;

  const tokens = user.fcmTokens.map(t => t.token);

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      )
    });

    // Remove invalid tokens
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code;
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      user.fcmTokens = user.fcmTokens.filter(
        t => !invalidTokens.includes(t.token)
      );
      await user.save();
    }
  } catch (error) {
    console.error('Push notification error:', error.message);
  }
}

module.exports = { sendPush };
