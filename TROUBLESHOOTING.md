# Troubleshooting Guide

## Port Mismatch Issue

### Problem
You're running ngrok on port 30000, but your server is on port 3000.

### Solution

**Option 1: Change ngrok to use port 3000 (Recommended)**
```bash
# Stop current ngrok
# Then run:
ngrok http 3000
```

**Option 2: Change server to use port 30000**
```bash
# In your .env file, add:
PORT=30000

# Then restart server:
npm run dev
```

## No Console Logs Appearing

### Check These:

1. **Is server running?**
   ```bash
   # You should see:
   🚀 Server running on port 3000
   ```

2. **Is ngrok pointing to correct port?**
   ```bash
   # Check ngrok dashboard: http://127.0.0.1:4040
   # Forwarding should show: https://xxx.ngrok.io -> http://localhost:3000
   ```

3. **Is webhook URL correct in Meta Console?**
   - Should be: `https://your-ngrok-url.ngrok.io/webhook`
   - NOT: `https://your-ngrok-url.ngrok.io` (missing /webhook)

4. **Check webhook verification:**
   ```bash
   # Test in browser or curl:
   curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
   ```

## 502 Bad Gateway Errors

### Common Causes:

1. **Server crashed** - Check server console for errors
2. **Database connection failed** - Check DATABASE_URL in .env
3. **Missing environment variables** - Check all required vars are set
4. **Port mismatch** - ngrok and server on different ports

### Fix:

1. **Check server logs:**
   ```bash
   npm run dev
   # Look for error messages
   ```

2. **Test server directly:**
   ```bash
   curl http://localhost:3000/health
   # Should return: {"status":"ok",...}
   ```

3. **Run test script:**
   ```bash
   node test-end-to-end.js
   ```

## No Data in Database

### Check:

1. **Is message being received?**
   - Check console for: `📥 [WEBHOOK] Received webhook request`
   - Check console for: `✅ [MESSAGE] Message saved to DB`

2. **Is command format correct?**
   - Must start with command name: `add_product`
   - Must use `key=value` format (not `Key: value`)

3. **Check database connection:**
   ```sql
   -- Run in Neon console:
   SELECT * FROM whatsapp_messages ORDER BY created_at DESC LIMIT 5;
   ```

4. **Check products table:**
   ```sql
   SELECT * FROM products ORDER BY created_at DESC LIMIT 5;
   ```

## Testing Steps

### Step 1: Verify Server is Running
```bash
npm run dev
# Should see: 🚀 Server running on port 3000
```

### Step 2: Test Health Endpoint
```bash
curl http://localhost:3000/health
# Should return JSON with status: "ok"
```

### Step 3: Test Webhook Verification
```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
# Should return: test123
```

### Step 4: Run End-to-End Test
```bash
# Set WEBHOOK_URL in .env or export:
export WEBHOOK_URL=http://localhost:3000/webhook
node test-end-to-end.js
```

### Step 5: Test with Real WhatsApp Message
Send this EXACT format in WhatsApp:
```
add_product
title=Test Product
slug=test-123
price=100
stock=10
```

## Common Mistakes

1. ❌ **Wrong message format:**
   ```
   Title: Product Name  # WRONG
   ```
   ✅ **Correct:**
   ```
   add_product
   title=Product Name
   ```

2. ❌ **Port mismatch:**
   - Server: 3000
   - ngrok: 30000
   ✅ **Fix:** Use same port for both

3. ❌ **Missing /webhook in URL:**
   - Wrong: `https://xxx.ngrok.io`
   - Correct: `https://xxx.ngrok.io/webhook`

4. ❌ **Wrong verify token:**
   - Must match in both .env and Meta Console

## Debug Checklist

- [ ] Server is running (`npm run dev`)
- [ ] Server shows: `🚀 Server running on port 3000`
- [ ] ngrok is running and forwarding to correct port
- [ ] Webhook URL in Meta Console includes `/webhook`
- [ ] Verify token matches in .env and Meta Console
- [ ] DATABASE_URL is correct in .env
- [ ] Message format is correct (starts with command name)
- [ ] Console shows webhook requests when message sent
- [ ] Database connection successful (check server logs)

## Get Help

If still having issues:

1. **Check server console** - Look for error messages
2. **Check ngrok dashboard** - http://127.0.0.1:4040
3. **Run test script** - `node test-end-to-end.js`
4. **Check database** - Verify tables exist and connection works
5. **Verify .env file** - All required variables are set
