const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Added for password hashing
const app = express();

// Enable CORS for your frontend
app.use(cors({
  origin: [
    'https://submit-splendid-queijadas-fe8409.netlify.app/', // Update with your new frontend URL
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define User Schema for redemption
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true }, // Store hashed password
  redemptionCode: { type: String, default: null }, // Store redemption code
  timestamp: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API to redeem a code
app.post('/api/redeem', async (req, res) => {
  console.log('Received POST /api/redeem:', req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('Validation failed: Email or password missing');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      // Validate password (if you’re implementing authentication)
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    } else {
      // Create new user with hashed password
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ email, password: hashedPassword });
    }

    // Redemption logic (customize based on your needs)
    // Example: Generate or retrieve a redemption code
    const redemptionCode = user.redemptionCode || generateRedemptionCode(); // Implement this function
    user.redemptionCode = redemptionCode;
    await user.save();

    console.log('Redemption processed:', { email, redemptionCode });
    res.status(201).json({ message: 'Code redeemed successfully', code: redemptionCode });
  } catch (error) {
    console.error('Error processing redemption:', error);
    res.status(500).json({ error: 'Failed to redeem code' });
  }
});

// Example function to generate a redemption code (customize as needed)
function generateRedemptionCode() {
  // Replace with actual logic to generate or retrieve a valid Google Play code
  return 'PLAY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Use Render's assigned port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
