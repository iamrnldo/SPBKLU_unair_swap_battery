const https = require('https');
const config = require('../config/config');

const jsonRequest = (url, { method = 'GET', body = null, timeoutMs = 20000 } = {}) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const payload = body ? JSON.stringify(body) : null;

    const req = https.request({
      method,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      headers: {
        Accept: 'application/json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      }
    }, (res) => {
      const chunks = [];

      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let data = null;

        if (raw) {
          try {
            data = JSON.parse(raw);
          } catch (error) {
            return reject(new Error(`Invalid JSON response from Pakasir: ${raw.slice(0, 250)}`));
          }
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          const message = data?.message || data?.error || raw || `Pakasir request failed with status ${res.statusCode}`;
          return reject(new Error(message));
        }

        resolve(data);
      });
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Pakasir request timeout'));
    });

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
};

const ensurePakasirConfigured = () => {
  if (!config.pakasir.project) {
    throw new Error('PAKASIR_PROJECT_SLUG is not configured');
  }
  if (!config.pakasir.apiKey) {
    throw new Error('PAKASIR_API_KEY is not configured');
  }
};

const buildBody = ({ orderId, amount }) => ({
  project: config.pakasir.project,
  order_id: orderId,
  amount: parseInt(amount, 10),
  api_key: config.pakasir.apiKey
});

const createQrisTransaction = async ({ orderId, amount }) => {
  ensurePakasirConfigured();

  const response = await jsonRequest(`${config.pakasir.baseUrl}/api/transactioncreate/qris`, {
    method: 'POST',
    body: buildBody({ orderId, amount })
  });

  if (!response?.payment?.payment_number) {
    throw new Error('Pakasir did not return a QRIS payment string');
  }

  return response.payment;
};

const getTransactionDetail = async ({ orderId, amount }) => {
  ensurePakasirConfigured();

  const params = new URLSearchParams({
    project: config.pakasir.project,
    amount: String(parseInt(amount, 10)),
    order_id: orderId,
    api_key: config.pakasir.apiKey
  });

  const response = await jsonRequest(`${config.pakasir.baseUrl}/api/transactiondetail?${params.toString()}`);
  return response?.transaction || null;
};

const cancelTransaction = async ({ orderId, amount }) => {
  ensurePakasirConfigured();

  return jsonRequest(`${config.pakasir.baseUrl}/api/transactioncancel`, {
    method: 'POST',
    body: buildBody({ orderId, amount })
  });
};

const simulatePayment = async ({ orderId, amount }) => {
  ensurePakasirConfigured();

  return jsonRequest(`${config.pakasir.baseUrl}/api/paymentsimulation`, {
    method: 'POST',
    body: buildBody({ orderId, amount })
  });
};

const buildCheckoutUrl = ({ orderId, amount, redirectUrl = null }) => {
  const params = new URLSearchParams({
    order_id: orderId,
    qris_only: '1'
  });

  if (redirectUrl) {
    params.set('redirect', redirectUrl);
  }

  return `${config.pakasir.baseUrl}/pay/${encodeURIComponent(config.pakasir.project)}/${parseInt(amount, 10)}?${params.toString()}`;
};

module.exports = {
  createQrisTransaction,
  getTransactionDetail,
  cancelTransaction,
  simulatePayment,
  buildCheckoutUrl
};
