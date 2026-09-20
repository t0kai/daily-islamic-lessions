// Vercel serverless function: POST /api/feedback
// The owner's email address lives ONLY in the FEEDBACK_TO environment variable.
const TYPES = ['Opinion', 'Idea or suggestion', 'Correction (mistake in a lesson)', 'Praise or dua', 'Other'];
const hits = new Map(); // best-effort, per warm instance (see README: add Vercel Firewall rate limit)
const WINDOW = 60 * 60 * 1000, MAX_PER_IP = 5;

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bad = s => /[\x00-\x1f\x7f]/.test(s) || s.includes(String.fromCharCode(0x2028)) || s.includes(String.fromCharCode(0x2029));
const send = (res, code, obj) => { res.setHeader('Cache-Control', 'no-store'); res.status(code).json(obj); };

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'Method not allowed.' }); }

  // Same-origin only
  const origin = req.headers.origin || '';
  const allowed = (process.env.SITE_ORIGIN || '').replace(/\/$/, '');
  let okOrigin = false;
  try { const h = new URL(origin).host; okOrigin = allowed ? origin === allowed : h === req.headers.host; } catch (e) {}
  if (!okOrigin) return send(res, 403, { error: 'Forbidden.' });

  if (!/^application\/json/i.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'Unsupported.' });
  const b = req.body;
  if (!b || typeof b !== 'object' || JSON.stringify(b).length > 8000) return send(res, 413, { error: 'Message too large.' });

  // Rate limit
  const ip = String((req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')).split(',')[0].trim();
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW);
  if (list.length >= MAX_PER_IP) return send(res, 429, { error: 'Too many messages. Please try again later.' });
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < WINDOW)) hits.delete(k);

  // Bots: honeypot filled, or form submitted impossibly fast -> pretend success
  if ((b.website && String(b.website).length) || Number(b.elapsed) < 3000) return send(res, 200, { ok: true });

  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const email = typeof b.email === 'string' ? b.email.trim() : '';
  const message = typeof b.message === 'string' ? b.message.trim() : '';
  const type = TYPES.includes(b.type) ? b.type : 'Other';
  if (name.length < 2 || name.length > 80 || bad(name)) return send(res, 400, { error: 'Please enter a valid name.' });
  if (email.length > 120 || bad(email) || !/^[^\s@<>()",;:']+@[^\s@<>()",;:']+\.[^\s@<>()",;:']{2,}$/.test(email)) return send(res, 400, { error: 'Please enter a valid email.' });
  if (message.length < 10 || message.length > 2000) return send(res, 400, { error: 'Message must be 10 to 2000 characters.' });

  const key = process.env.RESEND_API_KEY, to = process.env.FEEDBACK_TO;
  if (!key || !to) return send(res, 500, { error: 'Feedback is not configured yet.' });
  const from = process.env.FEEDBACK_FROM || 'Kids Daily Islamic Lessons <onboarding@resend.dev>';

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">
<p><b>From:</b> ${esc(name)} &lt;${esc(email)}&gt;<br><b>Topic:</b> ${esc(type)}</p>
<p style="white-space:pre-wrap;border-left:4px solid #0f6b63;padding-left:12px">${esc(message)}</p>
<p style="color:#666;font-size:12px">Sent from the website feedback form. Reply to this email to answer the sender.</p></div>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject: `[Feedback] ${type} from ${name}`.slice(0, 150), html, text: `From: ${name} <${email}>\nTopic: ${type}\n\n${message}` })
    });
    if (!r.ok) { console.error('Resend error', r.status); return send(res, 502, { error: 'Could not send right now. Please try again later.' }); }
    return send(res, 200, { ok: true });
  } catch (e) { console.error('Send failed'); return send(res, 502, { error: 'Could not send right now. Please try again later.' }); }
};
