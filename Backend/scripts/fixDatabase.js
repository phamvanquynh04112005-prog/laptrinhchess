// backend/scripts/fixDatabase.js - FIX MISSING COLUMNS
const { query, connectDB } = require("../config/database");

const fixDatabase = async () => {
  try {
    console.log("🔧 Starting database fix...\n");
    await connectDB();

    // ============ STEP 1: ADD MISSING COLUMNS TO USERS TABLE ============
    console.log("Step 1: Adding missing rating columns to users table...");

    const columnsToAdd = [
      { name: "bullet_rating", definition: "INT DEFAULT 1500" },
      { name: "blitz_rating", definition: "INT DEFAULT 1500" },
      { name: "rapid_rating", definition: "INT DEFAULT 1500" },
      { name: "classical_rating", definition: "INT DEFAULT 1500" },
      { name: "avatar", definition: "VARCHAR(500) DEFAULT NULL" },
      { name: "country", definition: "VARCHAR(100) DEFAULT NULL" },
      { name: "last_seen", definition: "DATETIME DEFAULT NULL" },
    ];

    for (const column of columnsToAdd) {
      try {
        await query(
          `ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`,
        );
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.code === "ER_DUP_FIELDNAME") {
          console.log(`ℹ️  Column ${column.name} already exists, skipping...`);
        } else {
          console.error(
            `❌ Error adding column ${column.name}:`,
            error.message,
          );
        }
      }
    }

    // ============ STEP 2: CREATE USER_STATS TABLE IF NOT EXISTS ============
    console.log("\nStep 2: Creating/updating user_stats table...");

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
      console.error("❌ Error creating user_stats table:", error.message);
    }

    // ============ STEP 3: SYNC EXISTING USERS TO USER_STATS ============
    console.log("\nStep 3: Syncing existing users to user_stats...");

    try {
      const [users] = await query("SELECT id FROM users");

      for (const user of users) {
        try {
          // Check if user_stats already exists
          const [existing] = await query(
            "SELECT id FROM user_stats WHERE user_id = ?",
            [user.id],
          );

          if (existing.length === 0) {
            await query(
              `INSERT INTO user_stats (user_id, bullet_rating, blitz_rating, rapid_rating, classical_rating)
               VALUES (?, 1500, 1500, 1500, 1500)`,
              [user.id],
            );
            console.log(`✅ Created user_stats for user ID: ${user.id}`);
          }
        } catch (error) {
          console.error(
            `❌ Error creating user_stats for user ${user.id}:`,
            error.message,
          );
        }
      }

      console.log(`✅ Synced ${users.length} users to user_stats table`);
    } catch (error) {
      console.error("❌ Error syncing users:", error.message);
    }

    // ============ STEP 4: UPDATE EXISTING USERS WITH DEFAULT RATINGS ============
    console.log("\nStep 4: Updating existing users with default ratings...");

    try {
      await query(`
        UPDATE users 
        SET bullet_rating = COALESCE(bullet_rating, 1500),
            blitz_rating = COALESCE(blitz_rating, 1500),
            rapid_rating = COALESCE(rapid_rating, 1500),
            classical_rating = COALESCE(classical_rating, 1500)
        WHERE bullet_rating IS NULL 
           OR blitz_rating IS NULL 
           OR rapid_rating IS NULL 
           OR classical_rating IS NULL
      `);
      console.log("✅ Updated all users with default ratings");
    } catch (error) {
      console.error("❌ Error updating default ratings:", error.message);
    }

    // ============ STEP 5: VERIFY CHANGES ============
    console.log("\nStep 5: Verifying database structure...");

    try {
      const [columns] = await query("DESCRIBE users");
      const columnNames = columns.map((col) => col.Field);

      const requiredColumns = [
        "bullet_rating",
        "blitz_rating",
        "rapid_rating",
        "classical_rating",
      ];

      const missingColumns = requiredColumns.filter(
        (col) => !columnNames.includes(col),
      );

      if (missingColumns.length === 0) {
        console.log("✅ All required columns exist in users table");
      } else {
        console.log("❌ Missing columns:", missingColumns.join(", "));
      }

      // Check user_stats table
      const [statsColumns] = await query("DESCRIBE user_stats");
      console.log(`✅ user_stats table has ${statsColumns.length} columns`);

      // Count rows
      const [userCount] = await query("SELECT COUNT(*) as count FROM users");
      const [statsCount] = await query(
        "SELECT COUNT(*) as count FROM user_stats",
      );

      console.log(`\n📊 Database Summary:`);
      console.log(`   - Users: ${userCount[0].count}`);
      console.log(`   - User Stats: ${statsCount[0].count}`);
    } catch (error) {
      console.error("❌ Error verifying database:", error.message);
    }

    console.log("\n🎉 Database fix completed successfully!");
    console.log("\n💡 Next steps:");
    console.log("   1. Restart backend server (npm start)");
    console.log("   2. Refresh frontend page");
    console.log("   3. Test matchmaking again");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  }
};

fixDatabase();
