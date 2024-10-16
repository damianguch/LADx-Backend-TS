// Function to Update Profile photo
const UpdateProfilePhoto = async () => {
  const profilePic = document.getElementById('profilePic');

  // Append the profile picture file if selected
  const fileInput = document.getElementById('profilePicInput');

  // Create a new FormData object
  const formData = new FormData();

  const file = fileInput.files[0];
  if (!file) {
    alert('Please select an image.');
    return;
  }

  // Add the profile picture file
  formData.append('profilePic', file);

  try {
    const userId = '6706531330437af5872e9c16';
    const baseUrl = 'https://localhost:1337';

    const res = await fetch(
      `${baseUrl}/api/v1/users/${userId}/profilePhoto`,

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
      profilePic.src = result.profilePhoto.profilePicUrl;

      // Clear the file input after submission
      fileInput.value = '';
    }
  } catch (error) {
    console.error('Error uploading profile image', error);
  }
};

// Capture form submission and invoke updateProfile on submit
const formUpload = document.getElementById('formUpload');
formUpload.addEventListener('submit', (e) => {
  e.preventDefault();
  UpdateProfilePhoto();
});

//  Fetch Image on Page Load
const fetchUserProfile = async () => {
  try {
    const userId = '6706531330437af5872e9c16';
    const baseUrl = 'https://localhost:1337';

    const res = await fetch(`${baseUrl}/api/v1/users/${userId}/profilePhoto`);
    if (res.ok) {
      const result = await res.json();
      profilePic.src = result.profilePic;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
};

// Call this function when the page loads
window.addEventListener('load', fetchUserProfile);
