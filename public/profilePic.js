const UpdateProfilePhoto = async () => {
  const profilePic = document.getElementById('profilePic');

  // Append the profile picture file if selected
  const fileInput = document.getElementById('profilePicInput');

  // Create a new FormData object
  const formData = new FormData();

  if (fileInput.files[0]) {
    // Add the profile picture file
    formData.append('profilePic', fileInput.files[0]);
  }

  try {
    const userId = '6706531330437af5872e9c16';
    const baseUrl = 'https://localhost:1337';

    const res = await fetch(
      `${baseUrl}/api/v1/users/${userId}/profilePic`,

      {
        method: 'PUT',
        body: formData
      }
    );

    if (res.ok) {
      const result = await res.json();
      console.log(result);

      // Update the profile picture on the page
      // profilePic.src = '../' + result.profilePhoto.profilePic;
      profilePic.src = result.profilePhoto.profilePic;

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
