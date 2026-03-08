import { pool } from "../config/neon";

export interface AddProductParams {
  title: string;
  slug: string;
  brand?: string;
  material?: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface UpdateProductParams {
  slug: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  material: string | null;
  price: number;
  stock: number;
}

/**
 * Add a new product with a variant
 */
export async function addProduct(params: AddProductParams): Promise<Product> {
  const { title, slug, brand, material, price, stock, imageUrl } = params;

  console.log("📦 [ADD PRODUCT] Starting product creation:", {
    title,
    slug,
    brand,
    material,
    price,
    stock,
    imageUrl: imageUrl ? "provided" : "not provided",
  });

  // Validate required fields
  if (!title || !slug || price === undefined || stock === undefined) {
    throw new Error("Missing required fields: title, slug, price, and stock are required");
  }

  // Check if product with slug already exists
  const existingProduct = await pool.query(
    `SELECT id FROM products WHERE slug = $1`,
    [slug]
  );

  if (existingProduct.rows.length > 0) {
    console.log(`❌ [ADD PRODUCT] Product with slug "${slug}" already exists`);
    throw new Error(`Product with slug "${slug}" already exists`);
  }

  // Start transaction
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert product
    const productResult = await client.query(
      `INSERT INTO products (id, title, slug, brand, material, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
       RETURNING id, title, slug, brand, material`,
      [title, slug, brand || null, material || null]
    );

    const productId = productResult.rows[0].id;
    console.log(`✅ [ADD PRODUCT] Product created with ID: ${productId}`);

    // Generate SKU
    const sku = `${slug}-S-${Date.now()}`.replace(/\s+/g, "-");

    // Insert product variant
    const variantResult = await client.query(
      `INSERT INTO product_variants (id, product_id, sku, price, stock_quantity, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [productId, sku, price, stock]
    );

    const variantId = variantResult.rows[0].id;
    console.log(`✅ [ADD PRODUCT] Variant created with ID: ${variantId}, SKU: ${sku}`);

    // Add image if provided
    if (imageUrl) {
      // Check if product_images table exists, if not, we'll skip image insertion
      try {
        await client.query(
          `INSERT INTO product_images (id, variant_id, url, sort_order, alt_text)
           VALUES (gen_random_uuid(), $1, $2, 0, $3)`,
          [variantId, imageUrl, title]
        );
        console.log(`✅ [ADD PRODUCT] Image added: ${imageUrl}`);
      } catch (imgError: any) {
        // If product_images table doesn't exist, log warning but don't fail
        if (imgError.code === "42P01") {
          console.log(`⚠️ [ADD PRODUCT] product_images table not found, skipping image insertion`);
        } else {
          throw imgError;
        }
      }
    }

    await client.query("COMMIT");
    console.log(`✅ [ADD PRODUCT] Transaction committed successfully for product: ${title} (${slug})`);

    return {
      id: productId,
      title: productResult.rows[0].title,
      slug: productResult.rows[0].slug,
      brand: productResult.rows[0].brand,
      material: productResult.rows[0].material,
      price,
      stock,
    };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error(`❌ [ADD PRODUCT] Error: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update product price or stock by slug
 */
export async function updateProduct(params: UpdateProductParams): Promise<Product | null> {
  const { slug, price, stock, imageUrl } = params;

  console.log("🔄 [UPDATE PRODUCT] Starting product update:", {
    slug,
    price: price !== undefined ? price : "not provided",
    stock: stock !== undefined ? stock : "not provided",
    imageUrl: imageUrl ? "provided" : "not provided",
  });

  if (!slug) {
    throw new Error("Slug is required");
  }

  if (price === undefined && stock === undefined && !imageUrl) {
    throw new Error("At least one of price, stock, or image_url must be provided");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Find product by slug
    const productResult = await client.query(
      `SELECT id, title, slug, brand, material FROM products WHERE slug = $1`,
      [slug]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");
      console.log(`❌ [UPDATE PRODUCT] Product with slug "${slug}" not found`);
      return null;
    }

    const productId = productResult.rows[0].id;
    console.log(`✅ [UPDATE PRODUCT] Product found: ${productResult.rows[0].title} (ID: ${productId})`);

    // Get or create variant (get first variant by price ASC)
    let variantId: string;
    const variantResult = await client.query(
      `SELECT id FROM product_variants 
       WHERE product_id = $1 
       ORDER BY price ASC 
       LIMIT 1`,
      [productId]
    );

    if (variantResult.rows.length > 0) {
      variantId = variantResult.rows[0].id;
    } else {
      // Create variant if it doesn't exist
      const sku = `${slug}-S-${Date.now()}`.replace(/\s+/g, "-");
      const newVariantResult = await client.query(
        `INSERT INTO product_variants (id, product_id, sku, price, stock_quantity, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        [productId, sku, price || 0, stock || 0]
      );
      variantId = newVariantResult.rows[0].id;
      console.log(`✅ [UPDATE PRODUCT] Created new variant: ${variantId}`);
    }

    // Update variant (price or stock)
    if (price !== undefined || stock !== undefined) {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (price !== undefined) {
        updates.push(`price = $${paramIndex}`);
        values.push(Math.max(0, Number(price)));
        paramIndex++;
        console.log(`🔄 [UPDATE PRODUCT] Updating price to: ${price}`);
      }

      if (stock !== undefined) {
        updates.push(`stock_quantity = $${paramIndex}`);
        values.push(Math.max(0, Number(stock)));
        paramIndex++;
        console.log(`🔄 [UPDATE PRODUCT] Updating stock to: ${stock}`);
      }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        values.push(variantId);
        await client.query(
          `UPDATE product_variants 
           SET ${updates.join(", ")} 
           WHERE id = $${paramIndex}`,
          values
        );
        console.log(`✅ [UPDATE PRODUCT] Variant updated successfully`);
      }
    }

    // Update or add image if provided
    if (imageUrl) {
      try {
        // Check if image already exists for this variant
        const existingImage = await client.query(
          `SELECT id FROM product_images WHERE variant_id = $1 ORDER BY sort_order ASC LIMIT 1`,
          [variantId]
        );

        if (existingImage.rows.length > 0) {
          // Update existing image
          await client.query(
            `UPDATE product_images SET url = $1 WHERE id = $2`,
            [imageUrl, existingImage.rows[0].id]
          );
          console.log(`✅ [UPDATE PRODUCT] Image updated: ${imageUrl}`);
        } else {
          // Insert new image
          await client.query(
            `INSERT INTO product_images (id, variant_id, url, sort_order, alt_text)
             VALUES (gen_random_uuid(), $1, $2, 0, $3)`,
            [variantId, imageUrl, productResult.rows[0].title]
          );
          console.log(`✅ [UPDATE PRODUCT] Image added: ${imageUrl}`);
        }
      } catch (imgError: any) {
        // If product_images table doesn't exist, log warning but don't fail
        if (imgError.code === "42P01") {
          console.log(`⚠️ [UPDATE PRODUCT] product_images table not found, skipping image update`);
        } else {
          throw imgError;
        }
      }
    }

    await client.query("COMMIT");
    console.log(`✅ [UPDATE PRODUCT] Transaction committed successfully for product: ${slug}`);

    // Fetch updated product with variant
    const finalResult = await client.query(
      `SELECT 
         p.id, p.title, p.slug, p.brand, p.material,
         COALESCE(pv.price, 0) as price,
         COALESCE(pv.stock_quantity, 0) as stock
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       WHERE p.slug = $1
       ORDER BY pv.price ASC
       LIMIT 1`,
      [slug]
    );

    if (finalResult.rows.length === 0) {
      return null;
    }

    const row = finalResult.rows[0];
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      brand: row.brand,
      material: row.material,
      price: Number(row.price),
      stock: Number(row.stock),
    };
  } catch (error: any) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete product by slug (cascades to variants)
 */
export async function deleteProduct(slug: string): Promise<boolean> {
  console.log(`🗑️ [DELETE PRODUCT] Attempting to delete product with slug: ${slug}`);

  if (!slug) {
    throw new Error("Slug is required");
  }

  // First, get product info for logging
  const productInfo = await pool.query(
    `SELECT id, title FROM products WHERE slug = $1`,
    [slug]
  );

  if (productInfo.rows.length === 0) {
    console.log(`❌ [DELETE PRODUCT] Product with slug "${slug}" not found`);
    return false;
  }

  console.log(`📋 [DELETE PRODUCT] Found product: ${productInfo.rows[0].title} (ID: ${productInfo.rows[0].id})`);

  const result = await pool.query(
    `DELETE FROM products WHERE slug = $1 RETURNING id, title`,
    [slug]
  );

  if (result.rows.length > 0) {
    console.log(`✅ [DELETE PRODUCT] Product deleted successfully: ${result.rows[0].title} (${slug})`);
    return true;
  }

  return false;
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const result = await pool.query(
    `SELECT 
       p.id, p.title, p.slug, p.brand, p.material,
       COALESCE(pv.price, 0) as price,
       COALESCE(pv.stock_quantity, 0) as stock
     FROM products p
     LEFT JOIN product_variants pv ON pv.product_id = p.id
     WHERE p.slug = $1
     ORDER BY pv.price ASC
     LIMIT 1`,
    [slug]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    brand: row.brand,
    material: row.material,
    price: Number(row.price),
    stock: Number(row.stock),
  };
}
