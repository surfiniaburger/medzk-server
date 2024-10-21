const redirectUri = 'https://your-app.com/callback'; // Replace with your app's redirect URI
const scopes = ['profile', 'email']; // Request user's profile and email
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(' ')}&response_type=code`;
window.location.href = authUrl;


const tokenUrl = 'https://oauth2.googleapis.com/token';
const params = new URLSearchParams({
  client_id: clientId,
  client_secret: clientSecret,
  code: authorizationCode,
  redirect_uri: redirectUri,
  grant_type: 'authorization_code',
});
fetch(tokenUrl, {
  method: 'POST',
  body: params,
})
  .then(response => response.json())
  .then(data => {
    // Store the access token (data.access_token)
  });


  fetch('https://your-api.com/protected-resource', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then(response => response.json())
    .then(data => {
      // Handle the API response
    });
  