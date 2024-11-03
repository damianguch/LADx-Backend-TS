// Using fetch API to send the request
async function updateRole(selectedRole) {
  const baseUrl = 'http://localhost:1337';
  try {
    const response = await fetch(`${baseUrl}/api/v1/user/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: selectedRole })
    });

    const result = await response.json();
    if (response.ok) {
      console.log('Role updated successfully:', result);
      // Redirect user or update the UI based on success
    } else {
      console.error('Error updating role:', result.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Event listeners for button clicks
document.getElementById('senderButton').onclick = () => updateRole('sender');
document.getElementById('travelerButton').onclick = () =>
  updateRole('traveler');
