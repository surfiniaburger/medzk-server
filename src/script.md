# Adding Leaderboard Functionality

This document outlines the steps to add leaderboard functionality to the existing application.  The changes will involve adding new routes to `record.js` and updating `ee.html` to interact with these routes.  No existing files will be overwritten.

## 1. Update User Score Route

Add a new POST route to `record.js` to update a user's score.  This route will require the user ID and the new score as input.

```javascript
router.post('/updateScore', async (req, res) => {
  try {
    const { userId, newScore } = req.body;

    // Validate inputs (add validation as needed)
    if (!userId || !newScore) {
      return res.status(400).json({ error: 'Missing userId or newScore' });
    }

    // Update user score in the database (assuming you have a 'users' collection)
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { score: newScore } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Score updated successfully' });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## 2. Get Leaderboard Route

Add a new GET route to `record.js` to retrieve the leaderboard data.  This route will return a list of users sorted by score in descending order.

```javascript
router.get('/leaderboard', async (req, res) => {
  try {
    // Fetch users sorted by score in descending order
    const users = await db.collection('users').find({}).sort({ score: -1 }).toArray();

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## 3. Update `ee.html`

Update `ee.html` to include JavaScript code that interacts with the new routes.  This code will handle updating the user's score after a game and fetching the leaderboard data to display it.  You'll need to adapt this code to your specific game logic and UI elements.

```html
<!DOCTYPE html>
<html>
<head>
  <title>Environmental Explorer</title>
</head>
<body>
  <h1>Environmental Explorer</h1>

  <div id="gameArea">
    <!-- Your game content here -->
  </div>

  <div id="leaderboard">
    <h2>Leaderboard</h2>
    <ul id="leaderboardList"></ul>
  </div>

  <script>
    async function updateScore(userId, score) {
      try {
        const response = await fetch('/updateScore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, newScore: score })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data.message);
      } catch (error) {
        console.error('Error updating score:', error);
      }
    }

    async function fetchLeaderboard() {
      try {
        const response = await fetch('/leaderboard');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const leaderboardData = await response.json();
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = ''; // Clear existing list

        leaderboardData.forEach(user => {
          const listItem = document.createElement('li');
          listItem.textContent = `${user.name}: ${user.score}`;
          leaderboardList.appendChild(listItem);
        });
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    }

    // Example usage:
    // After the game ends, call updateScore with the user ID and score
    // Then, call fetchLeaderboard to update the leaderboard display
    // ... (Your game logic to determine userId and score) ...
    // updateScore(userId, score);
    // fetchLeaderboard();

    // Initial leaderboard fetch on page load
    fetchLeaderboard();
  </script>
</body>
</html>
```

Remember to replace placeholders like `/updateScore` and `/leaderboard` with your actual route paths if they differ.  Also, adapt the JavaScript code to integrate seamlessly with your existing game logic and UI.  Ensure that your database schema includes a `score` field for each user.  You may need to add error handling and user authentication as appropriate.
