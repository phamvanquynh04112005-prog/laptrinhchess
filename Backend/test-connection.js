// test-connection.js
// Script để test kết nối MySQL trước khi chạy server chính
// Chạy: node test-connection.js

const mysql = require("mysql2/promise");
require("dotenv").config();

const testConnection = async () => {
  console.log("\n🔍 Testing MySQL Connection...\n");

  const config = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: parseInt(process.env.DB_PORT) || 3306,
  };

  console.log("📋 Configuration:");
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Password: ${config.password ? "***" : "(empty)"}\n`);

  try {
    console.log("⏳ Connecting to MySQL...");
    const connection = await mysql.createConnection(config);
    console.log("✅ Connection successful!\n");

    // Test query
    console.log("⏳ Testing query...");
    const [rows] = await connection.query("SELECT VERSION() as version");
    console.log(`✅ MySQL Version: ${rows[0].version}\n`);

    // List databases
    console.log("⏳ Listing databases...");
    const [databases] = await connection.query("SHOW DATABASES");
    console.log("📂 Available databases:");
    databases.forEach((db) => {
      console.log(`   - ${db.Database}`);
    });

    // Check if chess_game exists
    const dbName = process.env.DB_NAME || "chess_game";
    const dbExists = databases.some((db) => db.Database === dbName);

    console.log("\n" + "=".repeat(50));
    if (dbExists) {
      console.log(`✅ Database '${dbName}' already exists!`);

      // List tables
      await connection.query(`USE ${dbName}`);
      const [tables] = await connection.query("SHOW TABLES");

      if (tables.length > 0) {
        console.log(`📊 Tables in '${dbName}':`);
        tables.forEach((table) => {
          console.log(`   - ${Object.values(table)[0]}`);
        });
      } else {
        console.log(`ℹ️  Database '${dbName}' exists but has no tables yet.`);
        console.log("   Tables will be created when you start the server.");
      }
    } else {
      console.log(`ℹ️  Database '${dbName}' does not exist yet.`);
      console.log(
        "   It will be created automatically when you start the server."
      );
    }
    console.log("=".repeat(50) + "\n");

    await connection.end();

    console.log("✅ All checks passed!");
    console.log("\n💡 Next steps:");
    console.log("   1. Run: npm run dev");
    console.log("   2. Server will auto-create database and tables");
    console.log("   3. Open: http://localhost:5000/api/health\n");
  } catch (error) {
    console.error("\n❌ Connection failed!");
    console.error("Error:", error.message);
    console.error("\n🔧 Troubleshooting:");

    if (error.code === "ECONNREFUSED") {
      console.error("   ❌ MySQL is not running!");
      console.error("   ✅ Solution:");
      console.error("      1. Open XAMPP Control Panel");
      console.error("      2. Click 'Start' button next to MySQL");
      console.error("      3. Wait for MySQL to start (green highlight)");
      console.error("      4. Run this test again");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("   ❌ Wrong username or password!");
      console.error("   ✅ Solution:");
      console.error("      1. Check your .env file");
      console.error("      2. Default XAMPP:");
      console.error("         - DB_USER=root");
      console.error("         - DB_PASSWORD= (leave empty)");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.error("   ℹ️  Database doesn't exist yet (this is OK!)");
      console.error(
        "   ✅ It will be created automatically when you start the server"
      );
    } else {
      console.error("   ℹ️  Unknown error. Full error details:");
      console.error("      Code:", error.code);
      console.error("      SQL State:", error.sqlState);
    }

    console.error("\n");
    process.exit(1);
  }
};

// Run the test
testConnection();
