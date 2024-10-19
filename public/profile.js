const updateProfile = async () => {
  // Get values from form input fields
  const fullname = document.getElementById('fullname');
  const country = document.getElementById('country');
  const state = document.getElementById('state');

  // Create a new FormData object
  const formData = new FormData();

  // Append form fields to FormData
  formData.append('fullname', fullname.value);
  formData.append('country', country.value);
  formData.append('state', state.value);

  console.log(formData);

  try {
    const userId = '6706543830437af5872e9c1b';
    const baseURL = 'https://localhost:1337';
    const res = await fetch(
      `${baseURL}/api/v1/profile/${userId}`,

      {
        method: 'PUT',
        body: formData
      }
    );

    if (res.ok) {
      const result = await res.json();
      console.log('Profile updated successfully', result);

      // Clear input fields and file input
      fullname.value = '';
      country.value = '';
      state.value = '';
    }
  } catch (error) {
    console.error('Error updating profile', error);
  }
};

// Capture form submission and invoke updateProfile on submit
const formUpload = document.getElementById('formUpload');

// Add event listener for form submission
formUpload.addEventListener('submit', (e) => {
  e.preventDefault();
  updateProfile();
});
