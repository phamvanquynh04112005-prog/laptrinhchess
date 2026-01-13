const mysql = require("mysql2/promise");
require("dotenv").config();

// Cấu hình MySQL
const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chess_game",
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

let pool = null;

// Kết nối đến MySQL
const connectDB = async () => {
  try {
    if (pool) {
      return pool;
    }

    console.log(`🔌 Connecting to MySQL: ${config.host}:${config.port}`);
    console.log(`📁 Database: ${config.database}`);
    console.log(`👤 User: ${config.user}`);

    pool = mysql.createPool(config);

    // Test connection
    const connection = await pool.getConnection();
    console.log("✅ MySQL connected successfully");
    connection.release();

    return pool;
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    console.log("\n🔧 Debug info:");
    console.log("- Host:", config.host);
    console.log("- Database:", config.database);
    console.log("- User:", config.user);
    console.log("- Port:", config.port);

    pool = null;
    throw error;
  }
};

// Tạo database và bảng
const initDatabase = async () => {
  try {
    // Kết nối không chỉ định database để tạo database
    const tempPool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
    });

    // Tạo database nếu chưa tồn tại
    console.log("📝 Creating database if not exists...");
    await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
    console.log(`✅ Database '${config.database}' ready`);

    await tempPool.end();

    // Kết nối đến database
    await connectDB();

    // Tạo bảng users
    console.log("📝 Creating users table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rating INT DEFAULT 1200,
        games_played INT DEFAULT 0,
        games_won INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Users table ready");

    // Tạo bảng games
    console.log("📝 Creating games table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        opponent_type VARCHAR(10) DEFAULT 'AI',
        difficulty VARCHAR(10) DEFAULT 'medium',
        result VARCHAR(10) NOT NULL,
        moves_count INT DEFAULT 0,
        time_spent INT DEFAULT 0,
        fen_position TEXT,
        move_history TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Games table ready");

    // Tạo bảng game_analysis (cho phân tích trận đấu)
    console.log("📝 Creating game_analysis table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_analysis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        analysis_data TEXT,
        best_moves TEXT,
        mistakes_count INT DEFAULT 0,
        accuracy_percentage DECIMAL(5,2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        INDEX idx_game_id (game_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Game analysis table ready");

    console.log("🎉 Database initialization completed successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    console.log("\n🔧 Debug MySQL Error:");
    console.log("- Message:", error.message);
    console.log("- Code:", error.code);
    console.log("- SQL State:", error.sqlState);

    pool = null;
    throw error;
  }
};

// Helper function để thực thi query
const query = async (sql, params = []) => {
  try {
    if (!pool) {
      await connectDB();
    }

    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Query error:", error.message);
    console.error("Query SQL:", sql);
    console.error("Parameters:", params);

    // Thử kết nối lại nếu lỗi connection
    if (
      error.code === "PROTOCOL_CONNECTION_LOST" ||
      error.code === "ECONNREFUSED"
    ) {
      pool = null;
      await connectDB();
    }

    throw error;
  }
};

// Hàm kiểm tra kết nối
const checkConnection = async () => {
  try {
    if (!pool) {
      await connectDB();
    }
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Connection check failed:", error.message);
    pool = null;
    return false;
  }
};

// Graceful shutdown
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("MySQL pool closed");
  }
};

module.exports = {
  pool: () => pool,
  connectDB,
  initDatabase,
  query,
  checkConnection,
  closePool,
};
