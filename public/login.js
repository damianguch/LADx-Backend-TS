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

    // Send form data as JSON
    // const res = await fetch(`${baseURL}/api/v1/login`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json' // Specify JSON content type
    //        'Content-Type': 'application/x-www-form-urlencoded' // URL-encoded payloads
    //     },
    //     body: JSON.stringify({ email, password }) // Send email and password as JSON
    //   });

    const res = await fetch(
      `${baseURL}/api/v1/login`,

      {
        method: 'POST',
        body: formData
      }
    );

    console.log(res);

    if (!res.ok) {
      const result = await res.json();
      return console.log(result.message);
    }
    // Clear input fields and file input
    email.value = '';
    password.value = '';
    const result = await res.json();
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
