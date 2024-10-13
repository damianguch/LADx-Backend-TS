const UpdateProfilePhoto = async () => {
  // Append the profile picture file if selected
  const fileInput = document.getElementById('profilePicInput');

  // Create a new FormData object
  const formData = new FormData();

  if (fileInput.files[0]) {
    // Add the profile picture file
    formData.append('profilePic', fileInput.files[0]);
  }

  try {
    const userId = '6706543830437af5872e9c1b';
    const res = await fetch(
      `https://localhost:1337/api/v1/profilePic/${userId}`,

      {
        method: 'PUT',
        body: formData
      }
    );

    if (res.ok) {
      const result = await res.json();
      console.log('Profile Photo updated successfully', result);

      // Update the profile picture on the page
      document.getElementById('profilePic').src =
        '../' + result.data.profilePic;

      console.log(document.getElementById('profilePic'));

      // Clear the file input after submission
      fileInput.value = '';
    }
  } catch (error) {
    console.error('Error updating profile', error);
  }
};

// Capture form submission and invoke updateProfile on submit
const formUpload = document.getElementById('formUpload');
formUpload.addEventListener('submit', (e) => {
  e.preventDefault();
  UpdateProfilePhoto();
});
