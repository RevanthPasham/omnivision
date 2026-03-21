# How to Find Your ngrok Callback URL

## Step-by-Step Guide

### Step 1: Configure ngrok (One-time setup)

You already have the authtoken command. Run it once:

```bash
ngrok config add-authtoken 39NhmxFivprqNEbae63LXJPO9Jx_6F2gnBpXkiBZNgjPeDSU4
```

**Expected output:**
```
Authtoken saved to configuration file: C:\Users\rahul\.ngrok2\ngrok.yml
```

---

### Step 2: Start Your Server

In one terminal, start your Node.js server:

```bash
cd omnivisio
npm run dev
```

**Wait for:**
```
🚀 Server running on port 3000
```

**⚠️ Important:** Note which port your server is running on (default is 3000)

---

### Step 3: Start ngrok

In a **NEW terminal window**, run:

```bash
ngrok http 3000
```

**⚠️ Important:** The port must match your server port!

**If your server is on port 30000, use:**
```bash
ngrok http 30000
```

**Expected output:**
```
ngrok

Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

---

### Step 4: Find Your Callback URL

Look for the **Forwarding** line in the ngrok output:

```
Forwarding    https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

**Your callback URL is:** `https://abc123xyz.ngrok-free.app`

**⚠️ Note:** 
- The URL changes every time you restart ngrok (unless you have a paid plan)
- Copy the **HTTPS** URL (starts with `https://`)
- Don't include the arrow `->` part

---

### Step 5: Add `/webhook` to the URL

Your complete webhook callback URL should be:

```
https://abc123xyz.ngrok-free.app/webhook
```

**Format:** `https://your-ngrok-url.ngrok-free.app/webhook`

---

### Step 6: Use ngrok Web Interface (Alternative Method)

1. Open your browser
2. Go to: **http://127.0.0.1:4040**
3. You'll see the ngrok web interface
4. Look for the **Forwarding** section
5. Copy the HTTPS URL
6. Add `/webhook` at the end

**Example from web interface:**
```
Forwarding
https://abc123xyz.ngrok-free.app → http://localhost:3000
```

Your callback URL: `https://abc123xyz.ngrok-free.app/webhook`

---

## Complete Example

### Your Setup:

1. **Server running on:** Port 3000
2. **ngrok command:** `ngrok http 3000`
3. **ngrok output shows:**
   ```
   Forwarding    https://abc123xyz.ngrok-free.app -> http://localhost:3000
   ```

### Your Callback URL for Meta:

```
https://abc123xyz.ngrok-free.app/webhook
```

---

## Setting Up in Meta Developer Console

1. Go to: https://developers.facebook.com/
2. Select your WhatsApp app
3. Go to **Configuration** → **Webhooks**
4. Click **Edit** on the webhook subscription
5. Enter:
   - **Callback URL:** `https://abc123xyz.ngrok-free.app/webhook`
   - **Verify Token:** (same as `WHATSAPP_VERIFY_TOKEN` in your `.env`)
6. Click **Verify and Save**
7. Subscribe to `messages` field
8. Save changes

---

## Quick Reference

### Find Your URL:

**Method 1: Terminal Output**
```bash
ngrok http 3000
# Look for: Forwarding https://xxx.ngrok-free.app -> http://localhost:3000
# Your URL: https://xxx.ngrok-free.app/webhook
```

**Method 2: Web Interface**
```
Open: http://127.0.0.1:4040
Look for: Forwarding section
Copy: HTTPS URL
Add: /webhook at the end
```

### Your Complete Callback URL Format:

```
https://[your-ngrok-id].ngrok-free.app/webhook
```

---

## Important Notes

1. **URL Changes:** Free ngrok URLs change every time you restart ngrok
   - You'll need to update Meta Console each time
   - Paid plans can have fixed URLs

2. **Keep ngrok Running:**
   - Don't close the ngrok terminal
   - If you close it, the URL stops working
   - Restart ngrok = new URL = update Meta Console

3. **Port Must Match:**
   - Server on 3000 → ngrok http 3000
   - Server on 30000 → ngrok http 30000
   - Check your server console to see which port it's using

4. **Always Use HTTPS:**
   - Meta requires HTTPS
   - ngrok provides HTTPS automatically
   - Use the `https://` URL, not `http://`

---

## Troubleshooting

### Can't find the URL?

1. **Check ngrok is running:**
   ```bash
   # Should see ngrok output in terminal
   # Or open: http://127.0.0.1:4040
   ```

2. **Check server is running:**
   ```bash
   # Should see: 🚀 Server running on port 3000
   ```

3. **Check port matches:**
   ```bash
   # Server port must match ngrok port
   # Example: Both on 3000 or both on 30000
   ```

### URL not working?

1. **Test locally first:**
   ```bash
   curl http://localhost:3000/health
   # Should work
   ```

2. **Test ngrok URL:**
   ```bash
   curl https://your-ngrok-url.ngrok-free.app/health
   # Should work (replace with your actual URL)
   ```

3. **Check ngrok dashboard:**
   - Open: http://127.0.0.1:4040
   - Look for errors in the requests tab

---

## Example Workflow

```bash
# Terminal 1: Start server
cd omnivisio
npm run dev
# Output: 🚀 Server running on port 3000

# Terminal 2: Start ngrok
ngrok http 3000
# Output: Forwarding https://abc123.ngrok-free.app -> http://localhost:3000

# Copy this URL: https://abc123.ngrok-free.app
# Add /webhook: https://abc123.ngrok-free.app/webhook

# In Meta Console:
# Callback URL: https://abc123.ngrok-free.app/webhook
# Verify Token: (from your .env file)
```

---

## Quick Commands

```bash
# Start server
npm run dev

# Start ngrok (in new terminal)
ngrok http 3000

# View ngrok dashboard
# Open: http://127.0.0.1:4040

# Test webhook locally
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
```

---

## Summary

1. ✅ Run: `ngrok http 3000` (or your server port)
2. ✅ Copy the HTTPS URL from output
3. ✅ Add `/webhook` at the end
4. ✅ Use in Meta Console as Callback URL
5. ✅ Keep both server and ngrok running

**Your callback URL format:**
```
https://[ngrok-id].ngrok-free.app/webhook
```
