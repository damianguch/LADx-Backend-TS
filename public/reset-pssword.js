// POST: Password Reset
document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const email = urlParams.get('email');

  const resetForm = document.getElementById('reset-password-form');
  const errorMessage = document.getElementById('error-message');

  console.log(email);
  console.log(token);

  if (token && email) {
    document.getElementById('email').value = email;
    document.getElementById('token').value = token;
    resetForm.style.display = 'block';
  } else {
    errorMessage.style.display = 'block';
  }

  // Add form submission logic
  resetForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const token = document.getElementById('token').value;

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
      console.log('Passwords do not match!');
      return;
    }

    // Send request to reset password
    try {
      const res = await fetch('https://localhost:1337/api/v1/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          token,
          password
        })
      });

      console.log(res);

      const result = await res.json();
      if (!res.ok) {
        return console.log('Error: ' + result.message);
      }

      // Handle successful reset
      console.log('Password reset successful!');

      // Redirect to login page after successful reset
      window.location.href = 'https://localhost:1337/login.html';
    } catch (error) {
      console.error('Error:', error);
      console.log('Error reseting your password!');
    }
  });
});
