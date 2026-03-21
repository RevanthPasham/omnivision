import { Pool, PoolClient, QueryResult } from "pg";

let poolInstance: Pool | null = null;

// Lazy initialization of pool
const getPool = (): Pool => {
  if (!poolInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set. Please check your .env file.");
    }

    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("neon.tech") 
        ? { rejectUnauthorized: false }
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Test connection on initialization
    poolInstance.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
  }
  return poolInstance;
};

// Create a proxy object that forwards all calls to the pool
export const pool = {
  query: (text: string, params?: any[]): Promise<QueryResult> => {
    return getPool().query(text, params);
  },
  connect: (): Promise<PoolClient> => {
    return getPool().connect();
  },
  end: (): Promise<void> => {
    return getPool().end();
  },
  get totalCount(): number {
    return getPool().totalCount;
  },
  get idleCount(): number {
    return getPool().idleCount;
  },
  get waitingCount(): number {
    return getPool().waitingCount;
  }
};

// Helper function to test connection
export const testConnection = async (): Promise<boolean> => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set. Please check your .env file.");
    }

    const dbPool = getPool();
    const client = await dbPool.connect();
    await client.query("SELECT NOW()");
    client.release();
    console.log("✅ Database connection successful");
    return true;
  } catch (err: any) {
    console.error("❌ Database connection failed:", err.message);
    if (err.code === "ECONNREFUSED") {
      console.error("💡 Make sure:");
      console.error("   1. Your DATABASE_URL in .env is correct");
      console.error("   2. For Neon DB, use format: postgresql://user:password@host.neon.tech/dbname?sslmode=require");
      console.error("   3. Your database server is running and accessible");
    }
    return false;
  }
};
