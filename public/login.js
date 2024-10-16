// POST: Login user
const Login = async () => {
  // Get values from form input fields
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  //FormData object is sent as multipart/form-data
  // Create a new FormData object
  const formData = new FormData();

  // Append form fields to FormData
  formData.append('email', email);
  formData.append('password', password);

  console.log(formData);

  try {
    const baseURL = 'https://localhost:1337';

    const res = await fetch(
      `${baseURL}/api/v1/login`,

      {
        method: 'POST',
        body: formData
      }
    );

    console.log(res);
    const result = await res.json();

    if (!res.ok) {
      return console.log(result.message);
    }
    // Clear input fields and file input
    email.value = '';
    password.value = '';

    return console.log(result);
  } catch (error) {
    console.error('Login Error!', error);
  }
};

// Capture form submission and invoke updateProfile on submit
const formUpload = document.getElementById('formUpload');

// Add event listener for form submission
formUpload.addEventListener('submit', (e) => {
  e.preventDefault();
  Login();
});

// POST: Fotgot Password
document.addEventListener('DOMContentLoaded', function () {
  // Handle forgot password form submission
  const forgotPasswordForm = document.getElementById('forgot-password');
  const resetModal = $('#resetModalCenter');

  forgotPasswordForm.addEventListener('submit', async function (e) {
    // Prevent actual form submission
    e.preventDefault();

    const email = $('#forgot-email').val();
    const baseURL = 'https://localhost:1337';

    // Password reset logic(Send form data as JSON)
    try {
      const res = await fetch(`${baseURL}/api/v1/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // JSON payloads
        },
        body: JSON.stringify({ email }) // Send email and password as JSON
      });

      const result = await res.json();

      if (!res.ok) {
        return console.log(result.message);
      }

      // Show a success message or redirect the user
      console.log('Password reset request submitted!');

      // Close the modal after form submission
      resetModal.modal('hide');
    } catch (error) {
      console.log('Error:', error);
    }
  });

  // Handle submit button click inside the modal
  const modalSubmitButton = document.querySelector(
    '#resetModalCenter .btn-primary'
  );
  modalSubmitButton.addEventListener('click', function () {
    // Trigger form submission
    forgotPasswordForm.dispatchEvent(new Event('submit'));
  });
});
