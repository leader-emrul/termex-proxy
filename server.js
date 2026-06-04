const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const qs = require('querystring');

const app = express();
const PORT = process.env.PORT || 3000;

const APP_ID = '100067';
const LOCALE = 'en_BD';
const REGION = 'BD';
const USER_AGENT = 'GarenaMSDK/4.0.32 (Android; 30; en_BD)';

app.use(cors());
app.use(express.json());

const baseHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Accept': 'application/json',
  'User-Agent': USER_AGENT,
  'Accept-Language': 'en-GB,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
};

function log(route, status, msg) {
  const time = new Date().toISOString();
  console.log(`[${time}] ${route} → ${status} | ${msg}`);
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'TERMEX Proxy running', version: '2.0', time: new Date().toISOString() });
});

// API 1: Send OTP
app.post('/send-otp', async (req, res) => {
  const { email, access_token } = req.body;
  if (!email || !access_token) {
    return res.status(400).json({ result: -1, error: 'email এবং access_token দরকার' });
  }
  try {
    const body = qs.stringify({ email, locale: LOCALE, region: REGION, app_id: APP_ID, access_token });
    const response = await fetch(
      'https://ffmconnect.ppmainecoonghj.com/game/account_security/bind:send_otp',
      { method: 'POST', headers: baseHeaders, body }
    );
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
    log('/send-otp', response.status, email);
    if (response.status === 403) {
      return res.status(403).json({ result: -1, error: 'Bot protection triggered. DataDome block.', datadome: true });
    }
    res.status(response.status).json(data);
  } catch (err) {
    log('/send-otp', 'ERR', err.message);
    res.status(500).json({ result: -1, error: err.message });
  }
});

// API 2: Verify OTP — returns verifier_token
app.post('/verify-otp', async (req, res) => {
  const { email, otp, access_token } = req.body;
  if (!email || !otp || !access_token) {
    return res.status(400).json({ result: -1, error: 'email, otp এবং access_token দরকার' });
  }
  try {
    const body = qs.stringify({ email, otp, app_id: APP_ID, access_token });
    const response = await fetch(
      'https://ffmconnect.ppmainecoonghj.com/game/account_security/bind:verify_otp',
      { method: 'POST', headers: baseHeaders, body }
    );
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
    log('/verify-otp', response.status, email);
    if (response.status === 403) {
      return res.status(403).json({ result: -1, error: 'Bot protection triggered.', datadome: true });
    }
    res.status(response.status).json(data);
  } catch (err) {
    log('/verify-otp', 'ERR', err.message);
    res.status(500).json({ result: -1, error: err.message });
  }
});

// API 3: Create Bind — uses verifier_token from API 2 response
app.post('/create-bind', async (req, res) => {
  const { email, secondary_password, verifier_token, access_token } = req.body;
  if (!email || !secondary_password || !verifier_token || !access_token) {
    return res.status(400).json({ result: -1, error: 'email, secondary_password, verifier_token এবং access_token দরকার' });
  }
  try {
    const body = qs.stringify({ email, secondary_password, app_id: APP_ID, verifier_token, access_token });
    const response = await fetch(
      'https://ffmconnect.ppmainecoonghj.com/game/account_security/bind:create_bind_request',
      { method: 'POST', headers: baseHeaders, body }
    );
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
    log('/create-bind', response.status, email);
    if (response.status === 403) {
      return res.status(403).json({ result: -1, error: 'Bot protection triggered.', datadome: true });
    }
    res.status(response.status).json(data);
  } catch (err) {
    log('/create-bind', 'ERR', err.message);
    res.status(500).json({ result: -1, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`TERMEX Proxy v2.0 running on port ${PORT}`);
});
