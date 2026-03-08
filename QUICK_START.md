# Quick Start Guide - WhatsApp Commands

## ⚠️ IMPORTANT: Correct Message Format

You **MUST** start your message with the command name, then use `key=value` format for parameters.

## ❌ WRONG Format (What you sent):

```
Title: Cotton T-Shirt
Slug: cotton-tshirt
Brand: Nike
Material: Cotton
Price: ₹599.99
Stock: 50
Image: https://example.com/image.jpg
```

## ✅ CORRECT Format:

```
add_product
title=Cotton T-Shirt
slug=cotton-tshirt
brand=Nike
material=Cotton
price=599.99
stock=50
image_url=https://example.com/image.jpg
```

## Key Differences:

1. **First line must be the command**: `add_product` (not `Title:`)
2. **Use `=` not `:`**: `title=Cotton T-Shirt` (not `Title: Cotton T-Shirt`)
3. **No currency symbols**: `price=599.99` (not `Price: ₹599.99`)
4. **Lowercase parameter names**: `image_url` (not `Image`)

## All Commands:

### 1. Add Product
```
add_product
title=Product Name
slug=product-slug
price=100
stock=10
brand=Brand Name
material=Material
image_url=https://example.com/image.jpg
```

### 2. Update Product
```
update_product
slug=product-slug
price=150
```

or

```
update_product
slug=product-slug
stock=20
```

or

```
update_product
slug=product-slug
image_url=https://example.com/new-image.jpg
```

### 3. Delete Product
```
delete_product
slug=product-slug
```

### 4. Reports
```
report_top_products
```

```
report_low_products
```

```
export_sales_excel
```

## Testing Your Setup

1. **Check your server is running**: You should see `🚀 Server running on port 3000`
2. **Send a test message** in the correct format
3. **Check console logs**: You should see:
   - `📥 [WEBHOOK] Received webhook request`
   - `📨 [MESSAGE] Processing incoming message...`
   - `✅ [MESSAGE] Message saved to DB`
   - `✅ [MESSAGE] Command parsed: add_product`
   - `📦 [ADD PRODUCT] Starting product creation...`

## If You See 502 Errors

1. **Check server logs** - Look for error messages
2. **Verify environment variables** are set correctly
3. **Check database connection** - Make sure DATABASE_URL is correct
4. **Restart server** - Sometimes helps clear issues

## Common Mistakes

- ❌ Starting with `Title:` instead of `add_product`
- ❌ Using `:` instead of `=`
- ❌ Including currency symbols in price
- ❌ Using capital letters in parameter names (use lowercase)
- ❌ Missing required fields (title, slug, price, stock for add_product)
