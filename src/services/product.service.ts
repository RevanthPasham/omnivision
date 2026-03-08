import { pool } from "../config/neon";

export interface AddProductParams {
  title: string;
  slug: string;
  brand?: string;
  material?: string;
  price: number;
  stock: number;
}

export interface UpdateProductParams {
  slug: string;
  price?: number;
  stock?: number;
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
  const { title, slug, brand, material, price, stock } = params;

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

    // Generate SKU
    const sku = `${slug}-S-${Date.now()}`.replace(/\s+/g, "-");

    // Insert product variant
    await client.query(
      `INSERT INTO product_variants (id, product_id, sku, price, stock_quantity, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())`,
      [productId, sku, price, stock]
    );

    await client.query("COMMIT");

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
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update product price or stock by slug
 */
export async function updateProduct(params: UpdateProductParams): Promise<Product | null> {
  const { slug, price, stock } = params;

  if (!slug) {
    throw new Error("Slug is required");
  }

  if (price === undefined && stock === undefined) {
    throw new Error("At least one of price or stock must be provided");
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
      return null;
    }

    const productId = productResult.rows[0].id;

    // Update variant (get first variant by price ASC)
    if (price !== undefined || stock !== undefined) {
      const variantResult = await client.query(
        `SELECT id FROM product_variants 
         WHERE product_id = $1 
         ORDER BY price ASC 
         LIMIT 1`,
        [productId]
      );

      if (variantResult.rows.length > 0) {
        const variantId = variantResult.rows[0].id;
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (price !== undefined) {
          updates.push(`price = $${paramIndex}`);
          values.push(Math.max(0, Number(price)));
          paramIndex++;
        }

        if (stock !== undefined) {
          updates.push(`stock_quantity = $${paramIndex}`);
          values.push(Math.max(0, Number(stock)));
          paramIndex++;
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
        }
      }
    }

    await client.query("COMMIT");

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
  if (!slug) {
    throw new Error("Slug is required");
  }

  const result = await pool.query(
    `DELETE FROM products WHERE slug = $1 RETURNING id`,
    [slug]
  );

  return result.rows.length > 0;
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
