module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_key_change_me_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'secret',
    name: process.env.DB_NAME || 'spbklu_db'
  },
  pakasir: {
    baseUrl: process.env.PAKASIR_BASE_URL || 'https://app.pakasir.com',
    project: process.env.PAKASIR_PROJECT_SLUG || process.env.PAKASIR_SLUG || 'spbklu',
    apiKey: process.env.PAKASIR_API_KEY || '',
    webhookVerify: process.env.PAKASIR_WEBHOOK_VERIFY !== 'false'
  },
  swap: {
    cost: parseInt(process.env.SWAP_COST || '10000', 10)
  }
};
