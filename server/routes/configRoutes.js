import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

// @route   GET /api/config/gemini
// @desc    Get Gemini API key status
router.get('/gemini', (req, res) => {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) {
    return res.json({
      isConfigured: false,
      maskedKey: null,
      model: 'gemini-2.5-flash'
    });
  }

  const masked = key.length > 8 ? key.substring(0, 4) + '...' + key.substring(key.length - 4) : '****';
  res.json({
    isConfigured: true,
    maskedKey: masked,
    model: 'gemini-2.5-flash'
  });
});

// @route   POST /api/config/gemini
// @desc    Save and verify Gemini API key
router.post('/gemini', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return res.status(400).json({ message: 'Valid Gemini API key string is required' });
    }

    const cleanKey = apiKey.trim();

    // Verify key against Google Gemini API
    const testUrl = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + cleanKey;
    const testRes = await fetch(testUrl);
    if (!testRes.ok) {
      const errData = await testRes.json().catch(() => ({}));
      return res.status(400).json({
        message: 'Invalid Gemini API key or request rejected by Google',
        detail: errData.error?.message || testRes.statusText
      });
    }

    // Set process.env
    process.env.GEMINI_API_KEY = cleanKey;

    // Persist to .env file
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf-8');
      if (content.includes('GEMINI_API_KEY=')) {
        content = content.replace(/GEMINI_API_KEY=.*/g, 'GEMINI_API_KEY=' + cleanKey);
      } else {
        content += '\nGEMINI_API_KEY=' + cleanKey + '\n';
      }
      fs.writeFileSync(envPath, content, 'utf-8');
    }

    res.json({
      success: true,
      message: 'Gemini API key verified and saved successfully! Live AI assessment is now active.',
      isConfigured: true,
      model: 'gemini-2.5-flash'
    });
  } catch (err) {
    console.error('Save Gemini key error:', err);
    res.status(500).json({ message: 'Failed to configure Gemini API key', error: err.message });
  }
});

export default router;
