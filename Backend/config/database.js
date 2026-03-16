const mysql = require("mysql2/promise");
require("dotenv").config();

const config = {
  host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
  user: process.env.DB_USER || process.env.MYSQLUSER || "root",
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
  database:
    process.env.DB_NAME || process.env.MYSQLDATABASE || "chess_game",
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

let pool = null;

const connectDB = async () => {
  try {
    if (pool) return pool;

    console.log(`🔌 Connecting to MySQL: ${config.host}:${config.port}`);
    pool = mysql.createPool(config);

    const connection = await pool.getConnection();
    console.log("✅ MySQL connected successfully");
    connection.release();

    return pool;
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    pool = null;
    throw error;
  }
};

const initDatabase = async () => {
  try {
    const tempPool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
    });

    console.log("📝 Creating database if not exists...");
    await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
    console.log(`✅ Database '${config.database}' ready`);
    await tempPool.end();

    await connectDB();

    // Bảng users - THÊM CÁC CỘT RATING THEO TIME CONTROL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rating INT DEFAULT 1200,
        bullet_rating INT DEFAULT 1500,
        blitz_rating INT DEFAULT 1500,
        rapid_rating INT DEFAULT 1500,
        classical_rating INT DEFAULT 1500,
        games_played INT DEFAULT 0,
        games_won INT DEFAULT 0,
        puzzle_rating INT DEFAULT 1200,
        puzzles_solved INT DEFAULT 0,
        avatar VARCHAR(500) DEFAULT NULL,
        country VARCHAR(100) DEFAULT NULL,
        last_seen DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Thêm cột ratings nếu bảng cũ chưa có
    const addColumnIfNotExists = async (columnName, columnDefinition) => {
      try {
        await pool.query(
          `ALTER TABLE users ADD COLUMN ${columnName} ${columnDefinition}`,
        );
        console.log(`✅ Added column ${columnName}`);
      } catch (e) {
        if (e.code !== "ER_DUP_FIELDNAME") {
          console.warn(
            `Warning: Could not add column ${columnName}:`,
            e.message,
          );
        }
      }
    };

    await addColumnIfNotExists("bullet_rating", "INT DEFAULT 1500");
    await addColumnIfNotExists("blitz_rating", "INT DEFAULT 1500");
    await addColumnIfNotExists("rapid_rating", "INT DEFAULT 1500");
    await addColumnIfNotExists("classical_rating", "INT DEFAULT 1500");
    await addColumnIfNotExists("avatar", "VARCHAR(500) DEFAULT NULL");
    await addColumnIfNotExists("country", "VARCHAR(100) DEFAULT NULL");
    await addColumnIfNotExists("last_seen", "DATETIME DEFAULT NULL");

    // Bảng games
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

    // Bảng game_analysis
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_analysis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL,
        analysis_data TEXT,
        best_moves TEXT,
        mistakes_count INT DEFAULT 0,
        blunders_count INT DEFAULT 0,
        inaccuracies_count INT DEFAULT 0,
        accuracy_percentage DECIMAL(5,2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        INDEX idx_game_id (game_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bảng puzzles - Thư viện câu đố
    await pool.query(`
      CREATE TABLE IF NOT EXISTS puzzles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fen_position TEXT NOT NULL,
        solution_moves TEXT NOT NULL,
        difficulty VARCHAR(10) NOT NULL,
        rating INT DEFAULT 1200,
        themes TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_difficulty (difficulty),
        INDEX idx_rating (rating)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bảng puzzle_attempts - Lịch sử làm câu đố
    await pool.query(`
      CREATE TABLE IF NOT EXISTS puzzle_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        puzzle_id INT NOT NULL,
        solved BOOLEAN DEFAULT FALSE,
        attempts INT DEFAULT 1,
        time_spent INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
        INDEX idx_user_puzzle (user_id, puzzle_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bảng openings - Thư viện khai cuộc
    await pool.query(`
      CREATE TABLE IF NOT EXISTS openings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        eco_code VARCHAR(10),
        moves TEXT NOT NULL,
        fen_position TEXT,
        popularity INT DEFAULT 0,
        win_rate_white DECIMAL(5,2) DEFAULT 0,
        win_rate_black DECIMAL(5,2) DEFAULT 0,
        draw_rate DECIMAL(5,2) DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_eco (eco_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bảng user_openings - Khai cuộc người dùng thường dùng
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_openings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        opening_id INT NOT NULL,
        times_played INT DEFAULT 0,
        win_count INT DEFAULT 0,
        loss_count INT DEFAULT 0,
        draw_count INT DEFAULT 0,
        last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (opening_id) REFERENCES openings(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bảng endgames - Thư viện tàn cuộc
    await pool.query(`
      CREATE TABLE IF NOT EXISTS endgames (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        fen_position TEXT NOT NULL,
        solution TEXT NOT NULL,
        difficulty VARCHAR(10) NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_difficulty (difficulty)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bảng endgame_progress - Tiến độ học tàn cuộc
    await pool.query(`
      CREATE TABLE IF NOT EXISTS endgame_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        endgame_id INT NOT NULL,
        mastered BOOLEAN DEFAULT FALSE,
        attempts INT DEFAULT 0,
        successes INT DEFAULT 0,
        last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (endgame_id) REFERENCES endgames(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ============ TOURNAMENT & MATCHMAKING TABLES ============

    // Bảng matchmaking_queue - Hàng đợi tìm trận
    await pool.query(`
      CREATE TABLE IF NOT EXISTS matchmaking_queue (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        time_control VARCHAR(20) NOT NULL,
        rating INT NOT NULL,
        status VARCHAR(20) DEFAULT 'waiting',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_time_control (time_control),
        INDEX idx_rating (rating)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bảng online_games - Trận đấu trực tuyến
    await pool.query(`
      CREATE TABLE IF NOT EXISTS online_games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        white_player_id INT NOT NULL,
        black_player_id INT NOT NULL,
        time_control VARCHAR(20) NOT NULL,
        white_time INT NOT NULL,
        black_time INT NOT NULL,
        current_turn VARCHAR(5) DEFAULT 'white',
        status VARCHAR(20) DEFAULT 'ongoing',
        result VARCHAR(10),
        winner_id INT,
        fen_position TEXT,
        move_history TEXT,
        white_rating_before INT,
        black_rating_before INT,
        white_rating_after INT,
        black_rating_after INT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        finished_at DATETIME,
        FOREIGN KEY (white_player_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (black_player_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_white_player (white_player_id),
        INDEX idx_black_player (black_player_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bảng tournaments - Giải đấu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        format VARCHAR(20) NOT NULL,
        time_control VARCHAR(20) NOT NULL,
        max_players INT DEFAULT 16,
        current_players INT DEFAULT 0,
        min_rating INT DEFAULT 0,
        max_rating INT DEFAULT 3000,
        status VARCHAR(20) DEFAULT 'registration',
        creator_id INT NOT NULL,
        prize TEXT,
        current_round INT DEFAULT 0,
        total_rounds INT,
        start_time DATETIME,
        end_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_format (format)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bảng tournament_players - Người chơi trong giải
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tournament_players (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tournament_id INT NOT NULL,
        user_id INT NOT NULL,
        seed INT,
        score DECIMAL(4,1) DEFAULT 0,
        wins INT DEFAULT 0,
        losses INT DEFAULT 0,
        draws INT DEFAULT 0,
        rating_at_join INT NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_tournament_player (tournament_id, user_id),
        INDEX idx_score (score)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bảng tournament_matches - Các trận trong giải
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tournament_matches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tournament_id INT NOT NULL,
        round INT NOT NULL,
        white_player_id INT NOT NULL,
        black_player_id INT NOT NULL,
        game_id INT,
        result VARCHAR(10),
        winner_id INT,
        status VARCHAR(20) DEFAULT 'pending',
        scheduled_time DATETIME,
        played_at DATETIME,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (white_player_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (black_player_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES online_games(id) ON DELETE SET NULL,
        FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_tournament_round (tournament_id, round),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bảng rating_history - Lịch sử rating
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rating_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        game_id INT,
        time_control VARCHAR(20) DEFAULT 'rapid',
        rating_before INT NOT NULL,
        rating_after INT NOT NULL,
        rating_change INT NOT NULL,
        opponent_id INT,
        opponent_rating INT,
        game_result VARCHAR(10) NOT NULL,
        game_type VARCHAR(20) DEFAULT 'online',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES online_games(id) ON DELETE SET NULL,
        FOREIGN KEY (opponent_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bảng user_stats - Thống kê chi tiết
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        bullet_rating INT DEFAULT 1500,
        blitz_rating INT DEFAULT 1500,
        rapid_rating INT DEFAULT 1500,
        classical_rating INT DEFAULT 1500,
        total_games INT DEFAULT 0,
        wins INT DEFAULT 0,
        losses INT DEFAULT 0,
        draws INT DEFAULT 0,
        bullet_games INT DEFAULT 0,
        blitz_games INT DEFAULT 0,
        rapid_games INT DEFAULT 0,
        classical_games INT DEFAULT 0,
        tournaments_played INT DEFAULT 0,
        tournaments_won INT DEFAULT 0,
        peak_rating INT DEFAULT 1500,
        current_streak INT DEFAULT 0,
        best_streak INT DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_stats (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("🎉 Database initialization completed successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    pool = null;
    throw error;
  }
};

const query = async (sql, params = []) => {
  let retries = 3;

  while (retries > 0) {
    try {
      if (!pool) await connectDB();
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error("Query error:", error.message);

      if (
        error.code === "PROTOCOL_CONNECTION_LOST" ||
        error.code === "ECONNREFUSED" ||
        error.code === "ETIMEDOUT"
      ) {
        console.log(`Reconnecting... (${retries} attempts left)`);
        pool = null;
        retries--;

        if (retries === 0) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      throw error;
    }
  }
};

const checkConnection = async () => {
  try {
    if (!pool) await connectDB();
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Connection check failed:", error.message);
    pool = null;
    return false;
  }
};

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
