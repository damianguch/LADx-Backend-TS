const updateProfile = async () => {
  // Get values from form input fields
  const fullname = document.getElementById('fullname').value;
  const country = document.getElementById('country').value;
  const state = document.getElementById('state').value;

  // Create a new FormData object
  const formData = new FormData();

  // Append form data from the input fields
  formData.append('fullname', fullname);
  formData.append('country', country);
  formData.append('state', state);

  console.log(formData);

  try {
    const userId = '6706543830437af5872e9c1b';
    const res = await fetch(
      `https://localhost:1337/api/v1/profile/${userId}`,

      {
        method: 'PUT',
        body: formData
      }
    );

    if (res.ok) {
      const result = await res.json();
      console.log('Profile updated successfully', result);

      // Clear input fields and file input
      document.getElementById('fullname').value = '';
      document.getElementById('country').value = '';
      document.getElementById('state').value = '';
    }
  } catch (error) {
    console.error('Error updating profile', error);
  }
};

// Capture form submission and invoke updateProfile on submit
const formUpload = document.getElementById('formUpload');
formUpload.addEventListener('submit', (e) => {
  e.preventDefault();
  updateProfile();
});
