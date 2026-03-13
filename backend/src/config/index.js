require('dotenv').config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
  },
};

// Validation
const required = ['jwtSecret', 'databaseUrl'];
if (config.nodeEnv === 'production') {
  required.forEach(field => {
    if (!config[field]) {
      console.error(`❌ Missing required environment variable: ${field.toUpperCase()}`);
      process.exit(1);
    }
  });
} else {
  // Fallbacks for development only if absolutely necessary, but preferred to warn
  if (!config.jwtSecret) {
    config.jwtSecret = 'chess-academy-dev-secret';
    console.warn('⚠️  JWT_SECRET not provided, using insecure development fallback');
  }
  if (!config.databaseUrl) {
     console.error('❌ DATABASE_URL is required even in development');
     process.exit(1);
  }
}

module.exports = config;
