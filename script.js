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

// Append the profile picture file if selected
const fileInput = document.getElementById('profilePicInput');

if (fileInput.files[0]) {
  // Add the profile picture file
  formData.append('profilePic', fileInput.files[0]);
}

console.log(formData);

const updateProfile = async () => {
  try {
    const userId = '6706543830437af5872e9c1b';
    const res = await fetch(
      `https://localhost:1337/api/v1/users/${userId}`,

      {
        method: 'PUT',
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    console.log(res);
    if (res.ok) {
      const result = await res.json();
      console.log('Profile updated successfully', result);
      // Update the profile picture and user info on the page
      document.getElementById('profilePic').src = res.profilePic;
    }
  } catch (error) {
    console.error('Error updating profile', error);
  }
};

const formUpload = document.getElementById('formUpload');
formUpload.addEventListener('submit', (e) => {
  e.preventDefault();
  updateProfile();
});
