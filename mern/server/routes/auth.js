// // backend/routes/auth.js
// import express from 'express';
// const router = express.Router();
// import User from '../models/user';
// import jwt from 'jsonwebtoken';
// import auth from '../middleware/auth';

// // Register route
// router.post('/register', async (req, res) => {
//   try {
//     const { email, password, name } = req.body;
//     const user = new User({ email, password, name });
//     await user.save();
    
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '24h'
//     });
    
//     res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name } });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// // Login route
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       throw new Error('Invalid credentials');
//     }
    
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       throw new Error('Invalid credentials');
//     }
    
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '24h'
//     });
    
//     res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
//   } catch (error) {
//     res.status(401).json({ error: error.message });
//   }
// });

// // Protected route example
// router.get('/profile', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.userId).select('-password');
//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;
