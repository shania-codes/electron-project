const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', '..', 'minimacro.db');
const db = new sqlite3.Database(dbPath);

// Define functions before using them
function getUserData() {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM user_data WHERE id = 1", (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

function saveUserData(data) {
  return new Promise((resolve, reject) => {
    const stmt = `
      INSERT INTO user_data (id, bodyweight, bodyfat, calorie_target, protein_target, carb_target, fat_target)
      VALUES (1, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        bodyweight = excluded.bodyweight,
        bodyfat = excluded.bodyfat,
        calorie_target = excluded.calorie_target,
        protein_target = excluded.protein_target,
        carb_target = excluded.carb_target,
        fat_target = excluded.fat_target
    `;
    db.run(stmt, [
      data.bodyweight,
      data.bodyfat,
      data.calories,
      data.protein,
      data.carbs,
      data.fat
    ], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

db.serialize(() => {
  // User data table
  db.run(`CREATE TABLE IF NOT EXISTS user_data (
    id INTEGER PRIMARY KEY,
    bodyweight REAL,
    bodyfat REAL,
    calorie_target REAL,
    protein_target REAL,
    carb_target REAL,
    fat_target REAL
  )`);

  // Food entries table - add quantity column if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS food_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_name TEXT,
    quantity REAL DEFAULT 1,
    calories REAL,
    protein REAL,
    carbs REAL,
    fat REAL,
    date DATE DEFAULT (date('now'))
  )`);

  // Foods master table - stores food information for reuse
  db.run(`CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    serving_size REAL,
    serving_unit TEXT,
    calories REAL,
    protein REAL,
    carbs REAL,
    fat REAL,
    price REAL,
    store TEXT,
    use_by DATE,
    purchase_date DATE,
    created_date DATE DEFAULT (date('now')),
    last_used DATE DEFAULT (date('now'))
  )`);

  // Weight tracking table
  db.run(`CREATE TABLE IF NOT EXISTS weight_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE DEFAULT (date('now')),
    weight REAL,
    body_fat REAL,
    grip_strength REAL
  )`);

  // Add quantity column to existing table if it doesn't exist
  db.run(`ALTER TABLE food_entries ADD COLUMN quantity REAL DEFAULT 1`, (err) => {
    // This will fail if column already exists, which is fine
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding quantity column:', err);
    }
  });
});

function addFoodEntry(data) {
  return new Promise((resolve, reject) => {
    const stmt = `
      INSERT INTO food_entries (food_name, quantity, calories, protein, carbs, fat, date)
      VALUES (?, ?, ?, ?, ?, ?, date('now'))
    `;
    db.run(stmt, [
      data.foodName || null,
      data.quantity || 1,
      data.calories || null,
      data.protein || null,
      data.carbs || null,
      data.fat || null
    ], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function getFoodEntriesForToday() {
  return new Promise((resolve, reject) => {
    const stmt = `
      SELECT id, food_name, quantity, calories, protein, carbs, fat 
      FROM food_entries 
      WHERE date = date('now')
    `;
    db.all(stmt, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function deleteFoodEntry(id) {
  return new Promise((resolve, reject) => {
    const stmt = `DELETE FROM food_entries WHERE id = ?`;
    db.run(stmt, [id], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

function updateFoodEntry(id, data) {
  return new Promise((resolve, reject) => {
    const stmt = `
      UPDATE food_entries 
      SET food_name = ?, quantity = ?, calories = ?, protein = ?, carbs = ?, fat = ?
      WHERE id = ?
    `;
    db.run(stmt, [
      data.foodName || null,
      data.quantity || 1,
      data.calories || null,
      data.protein || null,
      data.carbs || null,
      data.fat || null,
      id
    ], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

// Foods master table functions
function saveFood(data) {
  return new Promise((resolve, reject) => {
    const stmt = `
      INSERT INTO foods (name, serving_size, serving_unit, calories, protein, carbs, fat, price, store, use_by, purchase_date, last_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))
    `;
    db.run(stmt, [
      data.name,
      data.serving_size || null,
      data.serving_unit || null,
      data.calories || null,
      data.protein || null,
      data.carbs || null,
      data.fat || null,
      data.price || null,
      data.store || null,
      data.use_by || null,
      data.purchase_date || null
    ], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function searchFoods(query) {
  return new Promise((resolve, reject) => {
    if (!query || query.trim().length < 2) {
      resolve([]);
      return;
    }
    
    const stmt = `
      SELECT * FROM foods 
      WHERE name LIKE ? 
      ORDER BY last_used DESC, name ASC 
      LIMIT 10
    `;
    db.all(stmt, [`%${query}%`], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function updateFoodLastUsed(foodId) {
  return new Promise((resolve, reject) => {
    const stmt = `UPDATE foods SET last_used = date('now') WHERE id = ?`;
    db.run(stmt, [foodId], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

// Weight tracking functions
function addWeightEntry(data) {
  return new Promise((resolve, reject) => {
    const stmt = `
      INSERT INTO weight_entries (date, weight, body_fat, grip_strength)
      VALUES (?, ?, ?, ?)
    `;
    db.run(stmt, [
      data.date || null,
      data.weight || null,
      data.body_fat || null,
      data.grip_strength || null
    ], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function getWeightEntries() {
  return new Promise((resolve, reject) => {
    const stmt = `
      SELECT * FROM weight_entries 
      ORDER BY date DESC
    `;
    db.all(stmt, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function deleteWeightEntry(id) {
  return new Promise((resolve, reject) => {
    const stmt = `DELETE FROM weight_entries WHERE id = ?`;
    db.run(stmt, [id], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

function updateWeightEntry(id, data) {
  return new Promise((resolve, reject) => {
    const stmt = `
      UPDATE weight_entries 
      SET date = ?, weight = ?, body_fat = ?, grip_strength = ?
      WHERE id = ?
    `;
    db.run(stmt, [
      data.date || null,
      data.weight || null,
      data.body_fat || null,
      data.grip_strength || null,
      id
    ], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

module.exports = { 
  getUserData, 
  saveUserData, 
  addFoodEntry, 
  getFoodEntriesForToday, 
  deleteFoodEntry,
  updateFoodEntry,
  saveFood,
  searchFoods,
  updateFoodLastUsed,
  addWeightEntry,
  getWeightEntries,
  deleteWeightEntry,
  updateWeightEntry
};