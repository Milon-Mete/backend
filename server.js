const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();

// Enable CORS for your frontend
app.use(cors({
  origin: [
    'https://submit-splendid-queijadas-fe8409.netlify.app',
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
  password: { type: String, required: true },
  redemptionCode: { type: String, default: null },
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
    let user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ email, password: hashedPassword });
    }

    const redemptionCode = user.redemptionCode || generateRedemptionCode(); // Generate if not already assigned
    user.redemptionCode = redemptionCode;
    await user.save();

    console.log('Redemption processed:', { email, redemptionCode });
    res.status(201).json({ message: 'Code redeemed successfully', code: redemptionCode });
  } catch (error) {
    console.error('Error processing redemption:', error);
    res.status(500).json({ error: 'Failed to redeem code' });
  }
});

// New improved function to generate a 16-char alphanumeric code like M57BO7XJLURCY08W
function generateRedemptionCode(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Use Render's assigned port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
