const form = document.getElementById('setupForm');
const submitButton = document.getElementById('submitButton');
const inputs = form.querySelectorAll('input');

// Change button text based on whether any field is filled
function updateButtonText() {
  const hasInput = Array.from(inputs).some(i => i.value.trim() !== '');
  submitButton.textContent = hasInput ? 'Submit' : 'Skip';
}

// Attach input listeners
inputs.forEach(input => {
  input.addEventListener('input', updateButtonText);
});

// Load saved data and pre-fill form
window.api.getData().then(data => {
  if (data) {
    // Fill fields
    document.getElementById('bodyweight').value = data.bodyweight ?? '';
    document.getElementById('bodyfat').value = data.bodyfat ?? '';
    document.getElementById('calories').value = data.calorie_target ?? '';
    document.getElementById('protein').value = data.protein_target ?? '';
    document.getElementById('carbs').value = data.carb_target ?? '';
    document.getElementById('fat').value = data.fat_target ?? '';
  }
  updateButtonText(); // Update button based on existing values
});

// On form submit
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = {
    bodyweight: parseFloat(document.getElementById('bodyweight').value) || 0,
    bodyfat: parseFloat(document.getElementById('bodyfat').value) || 0,
    calories: parseFloat(document.getElementById('calories').value) || 0,
    protein: parseFloat(document.getElementById('protein').value) || 0,
    carbs: parseFloat(document.getElementById('carbs').value) || 0,
    fat: parseFloat(document.getElementById('fat').value) || 0
  };

  const hasAnyInput = Object.values(formData).some(val => val !== 0);

  if (hasAnyInput) {
    await window.api.saveData(formData);
  }

  // Redirect either way
  window.location.href = './tracking.html';
});
