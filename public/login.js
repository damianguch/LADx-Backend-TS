// POST: Login user

// Capture form objects
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

// Function to display error messages
const showError = (message) => {
  errorMessage.innerText = message;
  errorMessage.style.display = 'block';
};

// Function to hide error messages
const hideError = () => {
  errorMessage.innerText = '';
  errorMessage.style.display = 'none';
};

const Login = async () => {
  // Get values from form input fields
  const email = document.getElementById('email');
  const password = document.getElementById('password');

  // Hide any previous errors
  hideError();

  //FormData object is sent as multipart/form-data
  // Create a new FormData object
  const formData = new FormData();

  // Append form fields to FormData
  formData.append('email', email.value);
  formData.append('password', password.value);

  try {
    const baseURL = 'https://localhost:1337';
    // const baseURL = 'https://ladx-backend-h9fg.onrender.com';

    const res = await fetch(
      `${baseURL}/api/v1/login`,

      {
        method: 'POST',
        body: formData,
        credentials: 'include'
      }
    );

    const result = await res.json();

    // Handle different response cases
    if (res.status === 400) {
      // Handle bad request (Missing email/password)
      showError(result.message);
    } else if (res.status === 401) {
      // Wrong email or password
      showError('Invalid login credentials!');
    } else if (res.status === 500) {
      showError('Server error, please try again later.');
    } else if (res.ok) {
      // Login successful, clear the form and redirect or show success
      email.value = '';
      password.value = '';

      console.log('Login successful!');
      // Redirect to dashboard or another page
      // window.location.href = '/dashboard.html';
    }

    return;
  } catch (error) {
    showError('Network error, please try again later.');
    console.error('Error during login:', error);
  }
};

// Capture form submission
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  Login();
});

// POST: Fotgot Password Request
const ForgotPassword = async () => {
  const email = $('#forgot-email').val();
  const baseURL = 'https://localhost:1337';

  // Password reset logic
  const res = await fetch(`${baseURL}/api/v1/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });

  const result = await res.json();

  if (!res.ok) {
    console.log(result.message);
    return false;
  }

  // Show a success message or redirect the user
  console.log('Password reset request submitted!');
  return true;
};

// Handle forgot password form submission
const forgotPasswordForm = document.getElementById('forgot-password');
const resetModal = $('#resetModalCenter');

forgotPasswordForm.addEventListener('submit', async function (e) {
  // Prevent actual form submission
  e.preventDefault();
  const result = await ForgotPassword();

  if (result) {
    // Close the modal after form submission
    resetModal.modal('hide');
  }
});
