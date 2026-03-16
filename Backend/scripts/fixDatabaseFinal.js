// backend/scripts/fixDatabaseFinal.js - FIX EVERYTHING ONCE AND FOR ALL
const mysql = require("mysql2/promise");
require("dotenv").config();

const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chess_game",
  port: parseInt(process.env.DB_PORT) || 3306,
};

async function fixDatabaseFinal() {
  let connection;

  try {
    console.log("🔧 FINAL DATABASE FIX - FIX EVERYTHING!\n");

    connection = await mysql.createConnection(config);
    console.log("✅ Connected to database\n");

    // ============ STEP 1: FIX USERS TABLE ============
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 1: Fixing users table");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const userColumns = [
      "bullet_rating INT DEFAULT 1500",
      "blitz_rating INT DEFAULT 1500",
      "rapid_rating INT DEFAULT 1500",
      "classical_rating INT DEFAULT 1500",
      "puzzle_rating INT DEFAULT 1200",
      "puzzles_solved INT DEFAULT 0",
      "avatar VARCHAR(500) DEFAULT NULL",
      "country VARCHAR(100) DEFAULT NULL",
      "last_seen DATETIME DEFAULT NULL",
    ];

    for (const colDef of userColumns) {
      const colName = colDef.split(" ")[0];
      try {
        await connection.query(`ALTER TABLE users ADD COLUMN ${colDef}`);
        console.log(`✅ Added users.${colName}`);
      } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME") {
          console.log(`ℹ️  users.${colName} exists`);
        } else {
          console.log(`⚠️  users.${colName}: ${err.message}`);
        }
      }
    }

    // ============ STEP 2: FIX MATCHMAKING_QUEUE TABLE ============
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 2: Fixing matchmaking_queue table");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Check if table exists
    const [queueTables] = await connection.query(
      "SHOW TABLES LIKE 'matchmaking_queue'",
    );

    if (queueTables.length === 0) {
      console.log("Creating matchmaking_queue table...");
      await connection.query(`
        CREATE TABLE matchmaking_queue (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          time_control VARCHAR(20) NOT NULL,
          rating INT NOT NULL,
          status VARCHAR(20) DEFAULT 'waiting',
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_status (status),
          INDEX idx_time_control (time_control),
          INDEX idx_rating (rating)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ Created matchmaking_queue table");
    } else {
      // Add missing columns
      const queueCols = [
        "status VARCHAR(20) DEFAULT 'waiting'",
        "joined_at DATETIME DEFAULT CURRENT_TIMESTAMP",
      ];

      for (const colDef of queueCols) {
        const colName = colDef.split(" ")[0];
        try {
          await connection.query(
            `ALTER TABLE matchmaking_queue ADD COLUMN ${colDef}`,
          );
          console.log(`✅ Added matchmaking_queue.${colName}`);
        } catch (err) {
          if (err.code === "ER_DUP_FIELDNAME") {
            console.log(`ℹ️  matchmaking_queue.${colName} exists`);
          } else {
            console.log(`⚠️  matchmaking_queue.${colName}: ${err.message}`);
          }
        }
      }

      // Rename created_at to joined_at if needed
      const [mqCols] = await connection.query("DESCRIBE matchmaking_queue");
      const mqColNames = mqCols.map((c) => c.Field);

      if (
        mqColNames.includes("created_at") &&
        !mqColNames.includes("joined_at")
      ) {
        try {
          await connection.query(
            "ALTER TABLE matchmaking_queue CHANGE created_at joined_at DATETIME DEFAULT CURRENT_TIMESTAMP",
          );
          console.log("✅ Renamed created_at → joined_at");
        } catch (err) {
          console.log("⚠️  Column rename:", err.message);
        }
      }
    }

    // ============ STEP 3: FIX ONLINE_GAMES TABLE ============
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 3: Fixing online_games table");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const gameCols = [
      "white_rating_before INT DEFAULT NULL",
      "black_rating_before INT DEFAULT NULL",
      "white_rating_after INT DEFAULT NULL",
      "black_rating_after INT DEFAULT NULL",
    ];

    for (const colDef of gameCols) {
      const colName = colDef.split(" ")[0];
      try {
        await connection.query(`ALTER TABLE online_games ADD COLUMN ${colDef}`);
        console.log(`✅ Added online_games.${colName}`);
      } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME") {
          console.log(`ℹ️  online_games.${colName} exists`);
        } else {
          console.log(`⚠️  online_games.${colName}: ${err.message}`);
        }
      }
    }

    // ============ STEP 4: CREATE USER_STATS TABLE ============
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 4: Creating user_stats table");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    await connection.query(`
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
    console.log("✅ user_stats table ready");

    // ============ STEP 5: CREATE RATING_HISTORY TABLE ============
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 5: Creating rating_history table");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS rating_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        game_id INT,
        time_control VARCHAR(20) DEFAULT 'rapid',
        old_rating INT NOT NULL,
        new_rating INT NOT NULL,
        rating_change INT NOT NULL,
        opponent_id INT,
        opponent_rating INT,
        result VARCHAR(10) NOT NULL,
        game_type VARCHAR(20) DEFAULT 'online',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES online_games(id) ON DELETE SET NULL,
        FOREIGN KEY (opponent_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ rating_history table ready");

    // ============ STEP 6: UPDATE EXISTING USERS ============
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 6: Updating existing users");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    await connection.query(`
      UPDATE users 
      SET bullet_rating = COALESCE(bullet_rating, 1500),
          blitz_rating = COALESCE(blitz_rating, 1500),
          rapid_rating = COALESCE(rapid_rating, 1500),
          classical_rating = COALESCE(classical_rating, 1500)
    `);
    console.log("✅ Set default ratings for all users");

    // ============ STEP 7: SYNC USER_STATS ============
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 7: Syncing user_stats");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const [users] = await connection.query("SELECT id FROM users");
    let syncCount = 0;

    for (const user of users) {
      try {
        await connection.query(
          `INSERT IGNORE INTO user_stats 
           (user_id, bullet_rating, blitz_rating, rapid_rating, classical_rating)
           VALUES (?, 1500, 1500, 1500, 1500)`,
          [user.id],
        );
        syncCount++;
      } catch (err) {
        // Ignore errors
      }
    }

    console.log(`✅ Synced ${syncCount}/${users.length} users`);

    // ============ STEP 8: CLEAN UP QUEUE ============
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 8: Cleaning matchmaking queue");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    await connection.query("DELETE FROM matchmaking_queue");
    console.log("✅ Cleared matchmaking queue");

    // ============ STEP 9: VERIFICATION ============
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 9: Database verification");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Verify users table
    const [userCols] = await connection.query("DESCRIBE users");
    const userColNames = userCols.map((c) => c.Field);
    const requiredUserCols = [
      "bullet_rating",
      "blitz_rating",
      "rapid_rating",
      "classical_rating",
    ];
    const missingUserCols = requiredUserCols.filter(
      (c) => !userColNames.includes(c),
    );

    if (missingUserCols.length === 0) {
      console.log("✅ users: All required columns present");
    } else {
      console.log("❌ users: Missing", missingUserCols);
    }

    // Verify matchmaking_queue
    const [mqCols] = await connection.query("DESCRIBE matchmaking_queue");
    const mqColNames = mqCols.map((c) => c.Field);

    if (mqColNames.includes("joined_at")) {
      console.log("✅ matchmaking_queue: joined_at column present");
    } else {
      console.log("❌ matchmaking_queue: joined_at column MISSING");
    }

    if (mqColNames.includes("status")) {
      console.log("✅ matchmaking_queue: status column present");
    } else {
      console.log("❌ matchmaking_queue: status column MISSING");
    }

    // Count records
    const [userCount] = await connection.query(
      "SELECT COUNT(*) as count FROM users",
    );
    const [statsCount] = await connection.query(
      "SELECT COUNT(*) as count FROM user_stats",
    );
    const [queueCount] = await connection.query(
      "SELECT COUNT(*) as count FROM matchmaking_queue",
    );
    const [gamesCount] = await connection.query(
      "SELECT COUNT(*) as count FROM online_games",
    );

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 DATABASE SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Users:          ${userCount[0].count}`);
    console.log(`User Stats:     ${statsCount[0].count}`);
    console.log(`Queue:          ${queueCount[0].count}`);
    console.log(`Online Games:   ${gamesCount[0].count}`);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 DATABASE FIX COMPLETED!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n💡 NEXT STEPS:");
    console.log("   1. Close this terminal");
    console.log("   2. Restart backend: npm start");
    console.log("   3. Refresh browser: F5");
    console.log("   4. Test /online page");
    console.log("\n✅ All database issues should be fixed now!\n");

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error.message);
    console.error(error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

fixDatabaseFinal();
