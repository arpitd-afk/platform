export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'chess-academy-dev-secret',
  databaseUrl: process.env.DATABASE_URL as string,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  frontendUrl: process.env.FRONTEND_URL || '',
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

if (!config.databaseUrl && config.nodeEnv === 'production') {
  console.error('❌ DATABASE_URL is required in production');
  process.exit(1);
}

export default config;
