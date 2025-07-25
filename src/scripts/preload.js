const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // User data
  getData: () => ipcRenderer.invoke('get-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  
  // Food entries
  addFoodEntry: (data) => ipcRenderer.invoke('add-food-entry', data),
  getFoodEntries: () => ipcRenderer.invoke('get-food-entries'),
  deleteFoodEntry: (id) => ipcRenderer.invoke('delete-food-entry', id),
  updateFoodEntry: (id, data) => ipcRenderer.invoke('update-food-entry', id, data),
  
  // Foods master table
  saveFood: (data) => ipcRenderer.invoke('save-food', data),
  searchFoods: (query) => ipcRenderer.invoke('search-foods', query),
  updateFoodLastUsed: (foodId) => ipcRenderer.invoke('update-food-last-used', foodId),
  
  // Weight tracking
  addWeightEntry: (data) => ipcRenderer.invoke('add-weight-entry', data),
  getWeightEntries: () => ipcRenderer.invoke('get-weight-entries'),
  deleteWeightEntry: (id) => ipcRenderer.invoke('delete-weight-entry', id),
  updateWeightEntry: (id, data) => ipcRenderer.invoke('update-weight-entry', id, data)
});