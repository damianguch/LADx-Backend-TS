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

  try {
    const baseURL = 'https://localhost:1337';
    // const baseURL = 'https://ladx-backend-h9fg.onrender.com';
    const res = await fetch(
      `${baseURL}/api/v1/users/profile`,

      {
        method: 'PUT',
        body: formData,
        credentials: 'include',
        headers: {
          'CSRF-Token': csrfToken // Insert the token dynamically
        }
      }
    );

    if (res.ok) {
      const result = await res.json();
      console.log(result.message);
      console.log(result.data);

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

// Fetch CSRF token and set it in the hidden input
const baseURL = 'https://localhost:1337';
fetch(`${baseURL}/api/v1/csrf-token`)
  .then((response) => response.json())
  .then((data) => {
    document.getElementById('csrfToken').value = data.csrfToken;
  })
  .catch((error) => console.error('Error fetching CSRF token:', error));
