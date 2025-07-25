const foodForm = document.getElementById('foodForm');
const foodTableBody = document.getElementById('foodTableBody');
const totalCalories = document.getElementById('totalCalories');
const totalProtein = document.getElementById('totalProtein');
const totalCarbs = document.getElementById('totalCarbs');
const totalFat = document.getElementById('totalFat');
const targetCalories = document.getElementById('targetCalories');
const targetProtein = document.getElementById('targetProtein');
const targetCarbs = document.getElementById('targetCarbs');
const targetFat = document.getElementById('targetFat');

// Progress bar elements
const caloriesProgress = document.getElementById('caloriesProgress');
const proteinProgress = document.getElementById('proteinProgress');
const carbsProgress = document.getElementById('carbsProgress');
const fatProgress = document.getElementById('fatProgress');

// Navigation buttons
const setupGoalsBtn = document.getElementById('setupGoalsBtn');
const chartsBtn = document.getElementById('chartsBtn');

// Autocomplete elements
const foodNameInput = document.getElementById('foodName');
const autocompleteDropdown = document.getElementById('autocompleteDropdown');

let userTargets = {};
let searchTimeout;
let selectedFoodId = null;

// Navigation
setupGoalsBtn.addEventListener('click', () => {
    window.location.href = './setup.html';
});

chartsBtn.addEventListener('click', () => {
    window.location.href = './charts.html';
});

// Food name autocomplete
foodNameInput.addEventListener('input', (event) => {
    const query = event.target.value.trim();
    
    clearTimeout(searchTimeout);
    
    if (query.length < 2) {
        hideAutocomplete();
        return;
    }
    
    searchTimeout = setTimeout(() => {
        searchFoods(query);
    }, 300);
});

// Hide autocomplete when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.autocomplete-container')) {
        hideAutocomplete();
    }
});

// Search for foods
function searchFoods(query) {
    window.api.searchFoods(query).then(foods => {
        showAutocomplete(foods);
    });
}

// Show autocomplete dropdown
function showAutocomplete(foods) {
    autocompleteDropdown.innerHTML = '';
    
    if (foods.length === 0) {
        hideAutocomplete();
        return;
    }
    
    foods.forEach(food => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.innerHTML = `
            <div class="food-name">${food.name}</div>
            <div class="food-details">${food.calories || 0} cal • ${food.serving_size || ''} ${food.serving_unit || ''}</div>
        `;
        
        item.addEventListener('click', () => {
            selectFood(food);
        });
        
        autocompleteDropdown.appendChild(item);
    });
    
    autocompleteDropdown.style.display = 'block';
}

// Hide autocomplete dropdown
function hideAutocomplete() {
    autocompleteDropdown.style.display = 'none';
}

// Select a food from autocomplete
function selectFood(food) {
    selectedFoodId = food.id;
    
    // Fill form with food data
    document.getElementById('foodName').value = food.name;
    document.getElementById('servingSize').value = food.serving_size || '';
    document.getElementById('servingUnit').value = food.serving_unit || '';
    document.getElementById('calories').value = food.calories || '';
    document.getElementById('protein').value = food.protein || '';
    document.getElementById('carbs').value = food.carbs || '';
    document.getElementById('fat').value = food.fat || '';
    document.getElementById('price').value = food.price || '';
    document.getElementById('store').value = food.store || '';
    document.getElementById('useBy').value = food.use_by || '';
    document.getElementById('purchaseDate').value = food.purchase_date || '';
    
    hideAutocomplete();
    
    // Update last used date
    window.api.updateFoodLastUsed(food.id);
}

// Load user targets
function loadUserTargets() {
    window.api.getData().then(data => {
        if (data) {
            userTargets = {
                calories: data.calorie_target || 0,
                protein: data.protein_target || 0,
                carbs: data.carb_target || 0,
                fat: data.fat_target || 0
            };
            
            // Update target displays
            targetCalories.textContent = userTargets.calories;
            targetProtein.textContent = userTargets.protein;
            targetCarbs.textContent = userTargets.carbs;
            targetFat.textContent = userTargets.fat;
            
            // Reload food entries to update progress bars
            loadFoodEntries();
        }
    });
}

// Update progress bars
function updateProgressBars(totals) {
    const updateProgressBar = (progressElement, current, target) => {
        if (target > 0) {
            const percentage = Math.min((current / target) * 100, 100);
            progressElement.style.width = percentage + '%';
            
            // Change color based on progress
            if (percentage >= 100) {
                progressElement.style.backgroundColor = '#4CAF50'; // Green when complete
            } else if (percentage >= 75) {
                progressElement.style.backgroundColor = '#FFC107'; // Yellow when close
            } else {
                progressElement.style.backgroundColor = '#2196F3'; // Blue for progress
            }
        } else {
            progressElement.style.width = '0%';
        }
    };

    updateProgressBar(caloriesProgress, totals.calories, userTargets.calories);
    updateProgressBar(proteinProgress, totals.protein, userTargets.protein);
    updateProgressBar(carbsProgress, totals.carbs, userTargets.carbs);
    updateProgressBar(fatProgress, totals.fat, userTargets.fat);
}

// Load existing food entries on page load
function loadFoodEntries() {
    window.api.getFoodEntries().then(entries => {
        foodTableBody.innerHTML = ''; // Clear existing entries
        let calories = 0, protein = 0, carbs = 0, fat = 0;

        entries.forEach(entry => {
            // Calculate totals with quantity multiplier
            const quantity = entry.quantity || 1;
            calories += (entry.calories || 0) * quantity;
            protein += (entry.protein || 0) * quantity;
            carbs += (entry.carbs || 0) * quantity;
            fat += (entry.fat || 0) * quantity;

            const row = createFoodEntryRow(entry);
            foodTableBody.appendChild(row);
        });

        // Update totals
        const totals = {
            calories: calories,
            protein: protein,
            carbs: carbs,
            fat: fat
        };
        
        totalCalories.textContent = totals.calories.toFixed(1);
        totalProtein.textContent = totals.protein.toFixed(1);
        totalCarbs.textContent = totals.carbs.toFixed(1);
        totalFat.textContent = totals.fat.toFixed(1);
        
        // Update progress bars
        updateProgressBars(totals);
    });
}

// Create a table row for a food entry
function createFoodEntryRow(entry) {
    const row = document.createElement('tr');
    const quantity = entry.quantity || 1;
    
    row.innerHTML = `
        <td>${entry.food_name || ''}</td>
        <td>${quantity}</td>
        <td>${((entry.calories || 0) * quantity).toFixed(1)}</td>
        <td>${((entry.protein || 0) * quantity).toFixed(1)}</td>
        <td>${((entry.carbs || 0) * quantity).toFixed(1)}</td>
        <td>${((entry.fat || 0) * quantity).toFixed(1)}</td>
        <td>
            <button class="edit-btn" data-id="${entry.id}">Edit</button>
            <button class="delete-btn" data-id="${entry.id}">Delete</button>
        </td>
    `;

    // Add delete button event listener
    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        // Check if we're currently editing this entry
        const addFoodButton = document.getElementById('addFoodButton');
        const currentEditId = addFoodButton.dataset.editId;
        
        // If we're editing this entry and it gets deleted, clear the form
        if (currentEditId && currentEditId === entry.id.toString()) {
            clearEditMode();
        }
        
        window.api.deleteFoodEntry(entry.id).then(() => {
            loadFoodEntries();
        });
    });

    // Add edit button event listener
    const editBtn = row.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => {
        populateFormForEdit(entry);
    });

    return row;
}

// Clear edit mode and reset form to add mode
function clearEditMode() {
    const addFoodButton = document.getElementById('addFoodButton');
    addFoodButton.textContent = 'Add Food';
    delete addFoodButton.dataset.editId;
    foodForm.reset();
    // Reset quantity to 1
    document.getElementById('quantity').value = '1';
    selectedFoodId = null;
}

// Populate form for editing
function populateFormForEdit(entry) {
    document.getElementById('foodName').value = entry.food_name || '';
    document.getElementById('quantity').value = entry.quantity || 1;
    document.getElementById('calories').value = entry.calories || '';
    document.getElementById('protein').value = entry.protein || '';
    document.getElementById('carbs').value = entry.carbs || '';
    document.getElementById('fat').value = entry.fat || '';

    // Change submit button to update
    const addFoodButton = document.getElementById('addFoodButton');
    addFoodButton.textContent = 'Update Food';
    addFoodButton.dataset.editId = entry.id;
    selectedFoodId = null; // Reset selected food ID when editing
}

// Form submission handler
foodForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Collect form data
    const quantity = parseFloat(document.getElementById('quantity').value) || 1;
    const formData = {
        foodName: document.getElementById('foodName').value.trim(),
        quantity: quantity,
        calories: parseFloat(document.getElementById('calories').value) || null,
        protein: parseFloat(document.getElementById('protein').value) || null,
        carbs: parseFloat(document.getElementById('carbs').value) || null,
        fat: parseFloat(document.getElementById('fat').value) || null
    };

    // Validation: ensure at least name or one numeric field is entered
    const hasValidInput = formData.foodName || 
        formData.calories || 
        formData.protein || 
        formData.carbs || 
        formData.fat;

    if (!hasValidInput) {
        alert('Please enter at least a food name or one nutritional value');
        return;
    }

    // Check if we're updating an existing entry
    const editId = event.target.querySelector('#addFoodButton').dataset.editId;

    try {
        if (editId) {
            // Update existing entry
            await window.api.updateFoodEntry(editId, formData);
            clearEditMode();
        } else {
            // Add new entry
            await window.api.addFoodEntry(formData);
            
            // Save food to master table if it's new or has additional info
            if (formData.foodName && !selectedFoodId) {
                const foodData = {
                    name: formData.foodName,
                    serving_size: parseFloat(document.getElementById('servingSize').value) || null,
                    serving_unit: document.getElementById('servingUnit').value.trim() || null,
                    calories: formData.calories,
                    protein: formData.protein,
                    carbs: formData.carbs,
                    fat: formData.fat,
                    price: parseFloat(document.getElementById('price').value) || null,
                    store: document.getElementById('store').value.trim() || null,
                    use_by: document.getElementById('useBy').value || null,
                    purchase_date: document.getElementById('purchaseDate').value || null
                };
                
                await window.api.saveFood(foodData);
            }
            
            // Reset form but keep quantity at 1
            foodForm.reset();
            document.getElementById('quantity').value = '1';
            selectedFoodId = null;
        }

        // Reload entries
        loadFoodEntries();
    } catch (error) {
        console.error('Error saving food entry:', error);
        alert('Failed to save food entry');
    }
});

// Initial load
loadUserTargets();
loadFoodEntries();