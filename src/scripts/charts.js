const weightForm = document.getElementById('weightForm');
const weightTableBody = document.getElementById('weightTableBody');
const backToTrackingBtn = document.getElementById('backToTrackingBtn');

let weightChart, bodyFatChart, gripStrengthChart;

// Set today's date as default
function setTodaysDate() {
    const today = new Date();
    const dateString = today.getFullYear() + '-' + 
                      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(today.getDate()).padStart(2, '0');
    document.getElementById('entryDate').value = dateString;
}

setTodaysDate();

// Navigation
backToTrackingBtn.addEventListener('click', () => {
    window.location.href = './tracking.html';
});

// Load and display weight entries
function loadWeightEntries() {
    window.api.getWeightEntries().then(entries => {
        weightTableBody.innerHTML = '';
        
        entries.forEach(entry => {
            const row = createWeightEntryRow(entry);
            weightTableBody.appendChild(row);
        });
        
        updateCharts(entries);
    });
}

// Create table row for weight entry
function createWeightEntryRow(entry) {
    const row = document.createElement('tr');
    
    // Format date for display
    const displayDate = entry.date ? new Date(entry.date).toLocaleDateString() : '';
    
    row.innerHTML = `
        <td>${displayDate}</td>
        <td>${entry.weight !== null && entry.weight !== undefined ? Number(entry.weight).toFixed(1) : '-'}</td>
        <td>${entry.body_fat !== null && entry.body_fat !== undefined ? Number(entry.body_fat).toFixed(1) : '-'}</td>
        <td>${entry.grip_strength !== null && entry.grip_strength !== undefined ? Number(entry.grip_strength).toFixed(1) : '-'}</td>
        <td>
            <button class="edit-btn" data-id="${entry.id}" type="button">Edit</button>
            <button class="delete-btn" data-id="${entry.id}" type="button">Delete</button>
        </td>
    `;

    // Add event listeners after DOM insertion
    const editBtn = row.querySelector('.edit-btn');
    const deleteBtn = row.querySelector('.delete-btn');

    // Edit button event listener
    editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Edit clicked for entry:', entry.id); // Debug log
        populateFormForEdit(entry);
    });

    // Delete button event listener
    deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this entry?')) {
            // Clear edit mode if deleting currently edited entry
            const addEntryButton = document.getElementById('addEntryButton');
            if (addEntryButton.dataset.editId === entry.id.toString()) {
                clearEditMode();
            }
            
            window.api.deleteWeightEntry(entry.id)
                .then(() => {
                    loadWeightEntries();
                })
                .catch(error => {
                    console.error('Error deleting entry:', error);
                    alert('Failed to delete entry');
                });
        }
    });

    return row;
}

// Populate form for editing
function populateFormForEdit(entry) {
    // Ensure all form fields exist before populating
    const dateField = document.getElementById('entryDate');
    const weightField = document.getElementById('weight');
    const bodyFatField = document.getElementById('bodyFat');
    const gripStrengthField = document.getElementById('gripStrength');
    const addEntryButton = document.getElementById('addEntryButton');

    if (!dateField || !weightField || !bodyFatField || !gripStrengthField || !addEntryButton) {
        console.error('Form fields not found');
        return;
    }

    // Populate fields with entry data
    dateField.value = entry.date || '';
    weightField.value = entry.weight !== null && entry.weight !== undefined ? entry.weight : '';
    bodyFatField.value = entry.body_fat !== null && entry.body_fat !== undefined ? entry.body_fat : '';
    gripStrengthField.value = entry.grip_strength !== null && entry.grip_strength !== undefined ? entry.grip_strength : '';

    // Update button state
    addEntryButton.textContent = 'Update Entry';
    addEntryButton.dataset.editId = entry.id;
    
    // Scroll to form for better UX
    document.querySelector('.weight-entry-section').scrollIntoView({ behavior: 'smooth' });
}

// Clear edit mode
function clearEditMode() {
    const addEntryButton = document.getElementById('addEntryButton');
    addEntryButton.textContent = 'Add Entry';
    delete addEntryButton.dataset.editId;
    weightForm.reset();
    setTodaysDate();
}

// Form submission
weightForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = {
        date: document.getElementById('entryDate').value || null,
        weight: parseFloat(document.getElementById('weight').value) || null,
        body_fat: parseFloat(document.getElementById('bodyFat').value) || null,
        grip_strength: parseFloat(document.getElementById('gripStrength').value) || null
    };

    // Validation: ensure at least one field is filled
    const hasValidInput = formData.weight || formData.body_fat || formData.grip_strength;

    if (!hasValidInput) {
        alert('Please enter at least one measurement');
        return;
    }

    const editId = event.target.querySelector('#addEntryButton').dataset.editId;

    try {
        if (editId) {
            await window.api.updateWeightEntry(editId, formData);
            clearEditMode();
        } else {
            await window.api.addWeightEntry(formData);
            weightForm.reset();
            setTodaysDate();
        }

        loadWeightEntries();
    } catch (error) {
        console.error('Error saving weight entry:', error);
        alert('Failed to save weight entry');
    }
});

// Update charts with data
function updateCharts(entries) {
    // Sort entries by date (oldest first for charts)
    const sortedEntries = entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Weight Chart
    const weightData = sortedEntries
        .filter(entry => entry.weight !== null && entry.weight !== undefined)
        .map(entry => ({ date: entry.date, value: entry.weight }));
    updateChart('weightChart', 'Weight (kg)', weightData, 'rgba(54, 162, 235, 0.8)', weightChart);
    
    // Body Fat Chart  
    const bodyFatData = sortedEntries
        .filter(entry => entry.body_fat !== null && entry.body_fat !== undefined)
        .map(entry => ({ date: entry.date, value: entry.body_fat }));
    updateChart('bodyFatChart', 'Body Fat (%)', bodyFatData, 'rgba(255, 99, 132, 0.8)', bodyFatChart);
    
    // Grip Strength Chart
    const gripStrengthData = sortedEntries
        .filter(entry => entry.grip_strength !== null && entry.grip_strength !== undefined)
        .map(entry => ({ date: entry.date, value: entry.grip_strength }));
    updateChart('gripStrengthChart', 'Grip Strength (lbs)', gripStrengthData, 'rgba(75, 192, 192, 0.8)', gripStrengthChart);
}

// Generic chart update function
function updateChart(canvasId, label, data, color, chartInstance) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    // If no data, show empty chart
    if (data.length === 0) {
        const newChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: label,
                    data: [],
                    borderColor: color,
                    backgroundColor: color.replace('0.8', '0.2'),
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
        
        // Store chart instance
        storeChartInstance(canvasId, newChart);
        return;
    }

    // Format data for Chart.js
    const chartData = data.map(point => ({
        x: formatDateForChart(point.date),
        y: point.value
    }));

    const newChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: label,
                data: chartData,
                borderColor: color,
                backgroundColor: color.replace('0.8', '0.2'),
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointBackgroundColor: color,
                pointBorderColor: color,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    ticks: {
                        color: 'white',
                        maxTicksLimit: 10
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });

    storeChartInstance(canvasId, newChart);
}

// Helper function to format date for chart display
function formatDateForChart(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
}

// Store chart instance based on canvas ID
function storeChartInstance(canvasId, chart) {
    if (canvasId === 'weightChart') {
        weightChart = chart;
    } else if (canvasId === 'bodyFatChart') {
        bodyFatChart = chart;
    } else if (canvasId === 'gripStrengthChart') {
        gripStrengthChart = chart;
    }
}

// Initial load
loadWeightEntries();