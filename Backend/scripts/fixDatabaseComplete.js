// backend/scripts/fixDatabaseComplete.js - FIX ALL DATABASE ISSUES
const { query, connectDB } = require("../config/database");

const fixDatabaseComplete = async () => {
  try {
    console.log("🔧 Starting COMPLETE database fix...\n");
    await connectDB();

    // ============ STEP 1: FIX USERS TABLE ============
    console.log("Step 1: Fixing users table...");

    const userColumns = [
      { name: "bullet_rating", definition: "INT DEFAULT 1500" },
      { name: "blitz_rating", definition: "INT DEFAULT 1500" },
      { name: "rapid_rating", definition: "INT DEFAULT 1500" },
      { name: "classical_rating", definition: "INT DEFAULT 1500" },
      { name: "avatar", definition: "VARCHAR(500) DEFAULT NULL" },
      { name: "country", definition: "VARCHAR(100) DEFAULT NULL" },
      { name: "last_seen", definition: "DATETIME DEFAULT NULL" },
    ];

    for (const column of userColumns) {
      try {
        await query(
          `ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`,
        );
        console.log(`✅ Added column users.${column.name}`);
      } catch (error) {
        if (error.code === "ER_DUP_FIELDNAME") {
          console.log(`ℹ️  Column users.${column.name} already exists`);
        } else {
          console.error(`❌ Error adding users.${column.name}:`, error.message);
        }
      }
    }

    // ============ STEP 2: FIX MATCHMAKING_QUEUE TABLE ============
    console.log("\nStep 2: Fixing matchmaking_queue table...");

    const queueColumns = [
      { name: "joined_at", definition: "DATETIME DEFAULT CURRENT_TIMESTAMP" },
      { name: "status", definition: "VARCHAR(20) DEFAULT 'waiting'" },
    ];

    for (const column of queueColumns) {
      try {
        await query(
          `ALTER TABLE matchmaking_queue ADD COLUMN ${column.name} ${column.definition}`,
        );
        console.log(`✅ Added column matchmaking_queue.${column.name}`);
      } catch (error) {
        if (error.code === "ER_DUP_FIELDNAME") {
          console.log(
            `ℹ️  Column matchmaking_queue.${column.name} already exists`,
          );
        } else {
          console.error(
            `❌ Error adding matchmaking_queue.${column.name}:`,
            error.message,
          );
        }
      }
    }

    // ✅ FIX: Đổi tên cột created_at thành joined_at nếu tồn tại
    try {
      const [columns] = await query("DESCRIBE matchmaking_queue");
      const hasCreatedAt = columns.some((col) => col.Field === "created_at");
      const hasJoinedAt = columns.some((col) => col.Field === "joined_at");

      if (hasCreatedAt && !hasJoinedAt) {
        await query(
          "ALTER TABLE matchmaking_queue CHANGE created_at joined_at DATETIME DEFAULT CURRENT_TIMESTAMP",
        );
        console.log("✅ Renamed created_at to joined_at");
      }
    } catch (error) {
      console.log("ℹ️  Column rename skipped:", error.message);
    }

    // ============ STEP 3: FIX ONLINE_GAMES TABLE ============
    console.log("\nStep 3: Fixing online_games table...");

    const gameColumns = [
      { name: "white_rating_before", definition: "INT DEFAULT NULL" },
      { name: "black_rating_before", definition: "INT DEFAULT NULL" },
      { name: "white_rating_after", definition: "INT DEFAULT NULL" },
      { name: "black_rating_after", definition: "INT DEFAULT NULL" },
    ];

    for (const column of gameColumns) {
      try {
        await query(
          `ALTER TABLE online_games ADD COLUMN ${column.name} ${column.definition}`,
        );
        console.log(`✅ Added column online_games.${column.name}`);
      } catch (error) {
        if (error.code === "ER_DUP_FIELDNAME") {
          console.log(`ℹ️  Column online_games.${column.name} already exists`);
        } else {
          console.error(
            `❌ Error adding online_games.${column.name}:`,
            error.message,
          );
        }
      }
    }

    // ============ STEP 4: CREATE RATING_HISTORY TABLE ============
    console.log("\nStep 4: Creating rating_history table...");

    try {
      await query(`
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
      console.log("✅ rating_history table created/verified");
    } catch (error) {
      console.error("❌ Error creating rating_history:", error.message);
    }

    // ============ STEP 5: CREATE USER_STATS TABLE ============
    console.log("\nStep 5: Creating user_stats table...");

    try {
      await query(`
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
      console.log("✅ user_stats table created/verified");
    } catch (error) {
      console.error("❌ Error creating user_stats:", error.message);
    }

    // ============ STEP 6: SYNC USERS ============
    console.log("\nStep 6: Syncing users...");

    try {
      // Update users with default ratings
      await query(`
        UPDATE users 
        SET bullet_rating = COALESCE(bullet_rating, 1500),
            blitz_rating = COALESCE(blitz_rating, 1500),
            rapid_rating = COALESCE(rapid_rating, 1500),
            classical_rating = COALESCE(classical_rating, 1500)
      `);
      console.log("✅ Updated users with default ratings");

      // Sync to user_stats
      const [users] = await query("SELECT id FROM users");
      let syncedCount = 0;

      for (const user of users) {
        try {
          await query(
            `INSERT IGNORE INTO user_stats (user_id, bullet_rating, blitz_rating, rapid_rating, classical_rating)
             VALUES (?, 1500, 1500, 1500, 1500)`,
            [user.id],
          );
          syncedCount++;
        } catch (error) {
          // Ignore duplicate key errors
        }
      }

      console.log(`✅ Synced ${syncedCount} users to user_stats`);
    } catch (error) {
      console.error("❌ Error syncing users:", error.message);
    }

    // ============ STEP 7: VERIFY DATABASE ============
    console.log("\nStep 7: Verifying database...");

    try {
      // Check users table
      const [userCols] = await query("DESCRIBE users");
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
        console.log("✅ users table: All required columns exist");
      } else {
        console.log("❌ users table missing:", missingUserCols.join(", "));
      }

      // Check matchmaking_queue table
      const [queueCols] = await query("DESCRIBE matchmaking_queue");
      const queueColNames = queueCols.map((c) => c.Field);

      if (queueColNames.includes("joined_at")) {
        console.log("✅ matchmaking_queue table: joined_at column exists");
      } else {
        console.log("❌ matchmaking_queue table: joined_at column missing");
      }

      // Count records
      const [userCount] = await query("SELECT COUNT(*) as count FROM users");
      const [statsCount] = await query(
        "SELECT COUNT(*) as count FROM user_stats",
      );
      const [queueCount] = await query(
        "SELECT COUNT(*) as count FROM matchmaking_queue",
      );

      console.log("\n📊 Database Summary:");
      console.log(`   - Users: ${userCount[0].count}`);
      console.log(`   - User Stats: ${statsCount[0].count}`);
      console.log(`   - Queue: ${queueCount[0].count}`);
    } catch (error) {
      console.error("❌ Verification error:", error.message);
    }

    console.log("\n🎉 COMPLETE database fix finished!");
    console.log("\n💡 Next steps:");
    console.log("   1. Restart backend: npm start");
    console.log("   2. Refresh frontend: F5");
    console.log("   3. Test matchmaking");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  }
};

fixDatabaseComplete();
