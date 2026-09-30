import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: parseInt(process.env.PORT || "4000", 10),

  mongodbUri: process.env.MONGODB_URI,

  redisUrl: process.env.REDIS_URL,

  rabbitmqUrl: process.env.RABBITMQ_URL,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,

  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,

  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",

  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  clientUrl: process.env.CLIENT_URL,

  apiBaseUrl: process.env.API_BASE_URL,

  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,

  aiApiKey: process.env.AI_API_KEY,

  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,

  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,

  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,

  sosNearbyRadiusKm: parseFloat(process.env.SOS_NEARBY_RADIUS_KM || "5"),

  sosExpandedRadiusKm: parseFloat(process.env.SOS_EXPANDED_RADIUS_KM || "20"),

  sosLocationFreshnessMinutes: parseInt(
    process.env.SOS_LOCATION_FRESHNESS_MINUTES || "10",
    10,
  ),

  sosAckTimeoutSeconds: parseInt(
    process.env.SOS_ACK_TIMEOUT_SECONDS || "60",
    10,
  ),

  admin: {
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
};
