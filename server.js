const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Enable CORS for Netlify frontends (update with your Netlify URLs after deployment)
app.use(cors({
  origin: ['https://submit-splendid-queijadas-fe8409.netlify.app/', 'https://dashboard-tubular-nougat-752387.netlify.app/'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Connect to MongoDB (use environment variable for MongoDB URI)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Score Schema
const scoreSchema = new mongoose.Schema({
  name: String,
  score: Number,
  timestamp: { type: Date, default: Date.now }
});
const Score = mongoose.model('Score', scoreSchema);

// API to submit a score
app.post('/api/scores', async (req, res) => {
  const { name, score } = req.body;
  if (!name || !score) return res.status(400).json({ error: 'Name and score are required' });
  const newScore = new Score({ name, score });
  await newScore.save();
  res.json({ message: 'Score submitted successfully' });
});

// API to get all scores
app.get('/api/scores', async (req, res) => {
  const scores = await Score.find().sort({ timestamp: -1 });
  res.json(scores);
});

// Use Render's assigned port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));