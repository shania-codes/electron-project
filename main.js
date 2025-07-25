const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./src/scripts/db');

async function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, './src/scripts/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Check if user data exists to determine which page to load
  try {
    const userData = await db.getUserData();
    // If user data exists and has at least one goal set, go to tracking
    if (userData && (userData.calorie_target > 0 || userData.protein_target > 0 || userData.carb_target > 0 || userData.fat_target > 0)) {
      win.loadFile('./src/pages/tracking.html');
    } else {
      win.loadFile('./src/pages/setup.html');
    }
  } catch (error) {
    // If there's an error, default to setup page
    console.error('Error checking user data:', error);
    win.loadFile('./src/pages/setup.html');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// User data handlers
ipcMain.handle('get-data', async () => {
  return db.getUserData();
});

ipcMain.handle('save-data', async (event, formData) => {
  return db.saveUserData(formData);
});

// Food entry handlers
ipcMain.handle('add-food-entry', async (event, formData) => {
  return db.addFoodEntry(formData);
});

ipcMain.handle('get-food-entries', async () => {
  return db.getFoodEntriesForToday();
});

ipcMain.handle('delete-food-entry', async (event, id) => {
  return db.deleteFoodEntry(id);
});

ipcMain.handle('update-food-entry', async (event, id, formData) => {
  return db.updateFoodEntry(id, formData);
});

// Foods master table handlers
ipcMain.handle('save-food', async (event, formData) => {
  return db.saveFood(formData);
});

ipcMain.handle('search-foods', async (event, query) => {
  return db.searchFoods(query);
});

ipcMain.handle('update-food-last-used', async (event, foodId) => {
  return db.updateFoodLastUsed(foodId);
});

// Weight tracking handlers
ipcMain.handle('add-weight-entry', async (event, formData) => {
  return db.addWeightEntry(formData);
});

ipcMain.handle('get-weight-entries', async () => {
  return db.getWeightEntries();
});

ipcMain.handle('delete-weight-entry', async (event, id) => {
  return db.deleteWeightEntry(id);
});

ipcMain.handle('update-weight-entry', async (event, id, formData) => {
  return db.updateWeightEntry(id, formData);
});