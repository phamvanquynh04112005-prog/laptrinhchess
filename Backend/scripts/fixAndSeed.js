// scripts/fixAndSeed.js - FIX AND SEED IN ONE STEP
const { query, connectDB } = require("../config/database");

const fixAndSeed = async () => {
  try {
    console.log("🔧 Starting database fix and seed...\n");
    await connectDB();

    // ============ STEP 1: DROP OLD TABLES ============
    console.log("Step 1: Dropping old tables...");
    await query("SET FOREIGN_KEY_CHECKS = 0");
    await query("DROP TABLE IF EXISTS puzzle_attempts");
    await query("DROP TABLE IF EXISTS puzzles");
    await query("DROP TABLE IF EXISTS user_openings");
    await query("DROP TABLE IF EXISTS openings");
    await query("DROP TABLE IF EXISTS endgame_progress");
    await query("DROP TABLE IF EXISTS endgames");
    await query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("✅ Dropped old tables\n");

    // ============ STEP 2: CREATE TABLES ============
    console.log("Step 2: Creating tables with correct schema...");

    // Bảng puzzles
    await query(`
      CREATE TABLE puzzles (
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
    console.log("✅ Created puzzles table");

    // Bảng puzzle_attempts
    await query(`
      CREATE TABLE puzzle_attempts (
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
    console.log("✅ Created puzzle_attempts table");

    // Bảng openings
    await query(`
      CREATE TABLE openings (
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
    console.log("✅ Created openings table");

    // Bảng user_openings
    await query(`
      CREATE TABLE user_openings (
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
    console.log("✅ Created user_openings table");

    // Bảng endgames
    await query(`
      CREATE TABLE endgames (
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
    console.log("✅ Created endgames table");

    // Bảng endgame_progress
    await query(`
      CREATE TABLE endgame_progress (
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
    console.log("✅ Created endgame_progress table\n");

    // ============ STEP 3: SEED PUZZLES ============
    console.log("Step 3: Seeding puzzles...");
    const puzzles = [
      // EASY
      {
        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
        solution: JSON.stringify([
          { from: [5, 5], to: [3, 6] },
          { from: [0, 6], to: [2, 5] },
          { from: [4, 2], to: [1, 5] },
        ]),
        difficulty: "easy",
        rating: 1200,
        themes: "fork,knight",
        description: "Mã chĩa đôi",
      },
      {
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
        solution: JSON.stringify([{ from: [4, 2], to: [1, 5] }]),
        difficulty: "easy",
        rating: 1250,
        themes: "sacrifice,bishop",
        description: "Hy sinh tượng",
      },
      {
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
        solution: JSON.stringify([{ from: [4, 2], to: [1, 5] }]),
        difficulty: "easy",
        rating: 1150,
        themes: "checkmate,bishop",
        description: "Chiếu hết nhanh",
      },
      {
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
        solution: JSON.stringify([{ from: [5, 5], to: [3, 6] }]),
        difficulty: "easy",
        rating: 1180,
        themes: "fork,knight",
        description: "Tấn công đòn đôi",
      },
      {
        fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
        solution: JSON.stringify([{ from: [5, 5], to: [3, 6] }]),
        difficulty: "easy",
        rating: 1220,
        themes: "discovery,attack",
        description: "Tấn công khám phá",
      },
      // MEDIUM
      {
        fen: "r2qkb1r/ppp2ppp/2np1n2/4p1B1/2B1P3/2N2N2/PPPP1PPP/R2QK2R w KQkq - 0 1",
        solution: JSON.stringify([
          { from: [5, 5], to: [3, 6] },
          { from: [0, 6], to: [2, 5] },
          { from: [6, 3], to: [1, 5] },
        ]),
        difficulty: "medium",
        rating: 1400,
        themes: "attack,combination",
        description: "Tổ hợp tấn công",
      },
      {
        fen: "r1bq1rk1/ppp2ppp/2np1n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 1",
        solution: JSON.stringify([
          { from: [5, 5], to: [3, 6] },
          { from: [0, 5], to: [3, 7] },
        ]),
        difficulty: "medium",
        rating: 1450,
        themes: "sacrifice,attack",
        description: "Hy sinh để tấn công",
      },
      {
        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
        solution: JSON.stringify([{ from: [5, 5], to: [3, 6] }]),
        difficulty: "medium",
        rating: 1420,
        themes: "pin,tactics",
        description: "Ghim quân",
      },
      {
        fen: "r2qk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1",
        solution: JSON.stringify([{ from: [4, 2], to: [1, 5] }]),
        difficulty: "medium",
        rating: 1480,
        themes: "discovery,checkmate",
        description: "Chiếu khám phá",
      },
      {
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
        solution: JSON.stringify([
          { from: [5, 5], to: [3, 6] },
          { from: [0, 4], to: [3, 7] },
        ]),
        difficulty: "medium",
        rating: 1500,
        themes: "skewer,tactics",
        description: "Xiên ngang",
      },
      // HARD
      {
        fen: "r2q1rk1/ppp2ppp/2np1n2/4p1B1/2B1P3/2N2N2/PPPP1PPP/R2QK2R w KQ - 0 1",
        solution: JSON.stringify([
          { from: [5, 5], to: [3, 6] },
          { from: [0, 6], to: [2, 5] },
          { from: [6, 3], to: [1, 5] },
          { from: [0, 3], to: [0, 7] },
        ]),
        difficulty: "hard",
        rating: 1800,
        themes: "attack,combination,sacrifice",
        description: "Tổ hợp phức tạp",
      },
      {
        fen: "r1bq1rk1/ppp2ppp/2n2n2/3pp3/1bB1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 1",
        solution: JSON.stringify([
          { from: [5, 5], to: [3, 6] },
          { from: [0, 7], to: [3, 7] },
        ]),
        difficulty: "hard",
        rating: 1850,
        themes: "sacrifice,mating-attack",
        description: "Tấn công chiếu hết",
      },
      {
        fen: "r2qkb1r/ppp2ppp/2np1n2/4p1B1/2B1P3/2N2N2/PPPP1PPP/R2Q1RK1 w kq - 0 1",
        solution: JSON.stringify([
          { from: [5, 5], to: [3, 6] },
          { from: [0, 6], to: [2, 5] },
        ]),
        difficulty: "hard",
        rating: 1780,
        themes: "tactics,pin",
        description: "Chiến thuật nâng cao",
      },
      {
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1",
        solution: JSON.stringify([
          { from: [5, 5], to: [3, 6] },
          { from: [0, 3], to: [3, 6] },
        ]),
        difficulty: "hard",
        rating: 1820,
        themes: "discovery,checkmate",
        description: "Chiếu hết phức tạp",
      },
      {
        fen: "r2q1rk1/ppp2ppp/2npbn2/4p1B1/2B1P3/2N2N2/PPPP1PPP/R2Q1RK1 w - - 0 1",
        solution: JSON.stringify([
          { from: [5, 5], to: [3, 6] },
          { from: [0, 6], to: [2, 5] },
          { from: [4, 2], to: [1, 5] },
        ]),
        difficulty: "hard",
        rating: 1900,
        themes: "attack,combination,sacrifice",
        description: "Siêu phức tạp",
      },
    ];

    for (const puzzle of puzzles) {
      await query(
        `INSERT INTO puzzles (fen_position, solution_moves, difficulty, rating, themes, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          puzzle.fen,
          puzzle.solution,
          puzzle.difficulty,
          puzzle.rating,
          puzzle.themes,
          puzzle.description,
        ],
      );
    }
    console.log(`✅ Seeded ${puzzles.length} puzzles\n`);

    // ============ STEP 4: SEED OPENINGS ============
    console.log("Step 4: Seeding openings...");
    const openings = [
      {
        name: "Italian Game",
        eco: "C50",
        moves: "e4,e5,Nf3,Nc6,Bc4",
        winRateWhite: 52.5,
        winRateBlack: 28.3,
        drawRate: 19.2,
        description: "Khai cuộc cổ điển",
      },
      {
        name: "Sicilian Defense",
        eco: "B20",
        moves: "e4,c5",
        winRateWhite: 54.1,
        winRateBlack: 27.9,
        drawRate: 18.0,
        description: "Phòng thủ phổ biến nhất",
      },
      {
        name: "French Defense",
        eco: "C00",
        moves: "e4,e6",
        winRateWhite: 53.8,
        winRateBlack: 28.5,
        drawRate: 17.7,
        description: "Phòng thủ vững chắc",
      },
      {
        name: "Caro-Kann Defense",
        eco: "B10",
        moves: "e4,c6",
        winRateWhite: 52.9,
        winRateBlack: 29.1,
        drawRate: 18.0,
        description: "Ít rủi ro",
      },
      {
        name: "Ruy Lopez",
        eco: "C60",
        moves: "e4,e5,Nf3,Nc6,Bb5",
        winRateWhite: 55.2,
        winRateBlack: 26.8,
        drawRate: 18.0,
        description: "Sâu sắc nhất",
      },
      {
        name: "Queen's Gambit",
        eco: "D06",
        moves: "d4,d5,c4",
        winRateWhite: 54.8,
        winRateBlack: 27.2,
        drawRate: 18.0,
        description: "Hy sinh tốt",
      },
      {
        name: "King's Indian Defense",
        eco: "E60",
        moves: "d4,Nf6,c4,g6",
        winRateWhite: 51.5,
        winRateBlack: 30.5,
        drawRate: 18.0,
        description: "Hypermodern",
      },
      {
        name: "London System",
        eco: "D02",
        moves: "d4,d5,Bf4",
        winRateWhite: 53.2,
        winRateBlack: 28.8,
        drawRate: 18.0,
        description: "Đơn giản dễ học",
      },
    ];

    for (const opening of openings) {
      await query(
        `INSERT INTO openings (name, eco_code, moves, win_rate_white, win_rate_black, draw_rate, description, popularity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          opening.name,
          opening.eco,
          opening.moves,
          opening.winRateWhite,
          opening.winRateBlack,
          opening.drawRate,
          opening.description,
          100,
        ],
      );
    }
    console.log(`✅ Seeded ${openings.length} openings\n`);

    // ============ STEP 5: SEED ENDGAMES ============
    console.log("Step 5: Seeding endgames...");
    const endgames = [
      {
        name: "King and Pawn vs King",
        category: "Basic Pawn Endgames",
        fen: "8/8/8/3k4/8/3P4/3K4/8 w - - 0 1",
        solution: JSON.stringify([
          "Move pawn forward",
          "Support with king",
          "Promote to queen",
        ]),
        difficulty: "easy",
        description: "Tàn cuộc cơ bản nhất",
      },
      {
        name: "Rook vs Pawn",
        category: "Rook Endgames",
        fen: "8/8/8/8/8/3k4/3p4/3RK3 w - - 0 1",
        solution: JSON.stringify([
          "Cut off enemy king",
          "Attack pawn from behind",
          "Win the pawn",
        ]),
        difficulty: "medium",
        description: "Xe vs tốt",
      },
      {
        name: "Lucena Position",
        category: "Rook Endgames",
        fen: "1K6/1P1k4/8/8/8/8/3r4/4R3 w - - 0 1",
        solution: JSON.stringify([
          "Build a bridge",
          "Block checks",
          "Promote pawn",
        ]),
        difficulty: "hard",
        description: "Thế cờ Lucena",
      },
      {
        name: "Philidor Position",
        category: "Rook Endgames",
        fen: "3k4/R7/8/8/8/3KP3/5r2/8 b - - 0 1",
        solution: JSON.stringify([
          "Keep rook on 6th rank",
          "Give checks when pawn advances",
          "Force a draw",
        ]),
        difficulty: "hard",
        description: "Thế cờ Philidor",
      },
      {
        name: "Queen vs Pawn on 7th",
        category: "Queen Endgames",
        fen: "8/3p4/3k4/8/8/8/8/3QK3 w - - 0 1",
        solution: JSON.stringify([
          "Control queening square",
          "Check enemy king",
          "Capture pawn",
        ]),
        difficulty: "medium",
        description: "Hậu vs tốt",
      },
      {
        name: "Two Bishops vs King",
        category: "Minor Piece Endgames",
        fen: "8/8/8/3k4/8/8/3BB3/3K4 w - - 0 1",
        solution: JSON.stringify([
          "Force king to edge",
          "Coordinate bishops",
          "Deliver checkmate",
        ]),
        difficulty: "easy",
        description: "Hai tượng chiếu hết",
      },
    ];

    for (const endgame of endgames) {
      await query(
        `INSERT INTO endgames (name, category, fen_position, solution, difficulty, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          endgame.name,
          endgame.category,
          endgame.fen,
          endgame.solution,
          endgame.difficulty,
          endgame.description,
        ],
      );
    }
    console.log(`✅ Seeded ${endgames.length} endgames\n`);

    console.log("🎉 Database fixed and seeded successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - ${puzzles.length} Puzzles (5 easy, 5 medium, 5 hard)`);
    console.log(`   - ${openings.length} Openings`);
    console.log(`   - ${endgames.length} Endgames`);
    console.log("\n✅ Ready to use! Restart backend and refresh web page.");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
};

fixAndSeed();
