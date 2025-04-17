const express = require('mongoose');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Enable CORS for Netlify frontends and local development
app.use(cors({
  origin: [
    'https://submit-splendid-queijadas-fe8409.netlify.app',
    'https://dashboard-tubular-nougat-752387.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173' // For Vite or other local dev servers
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Connect to MongoDB (use environment variable for MongoDB URI)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log('Connected to MongoDB');
    // Insert an example score
    try {
      const exampleScore = new Score({
        name: 'Example User',
        score: 100,
        timestamp: new Date()
      });
      await exampleScore.save();
      console.log('Example score inserted:', exampleScore);
    } catch (error) {
      console.error('Error inserting example score:', error);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Define Score Schema
const scoreSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  score: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});
const Score = mongoose.model('Score', scoreSchema);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API to submit a score
app.post('/api/scores', async (req, res) => {
  console.log('Received POST /api/scores:', req.body);
  const { name, score } = req.body;
  if (!name || typeof score !== 'number') {
    console.log('Validation failed: Name or score invalid');
    return res.status(400).json({ error: 'Name and a valid score are required' });
  }
  try {
    const newScore = new Score({ name, score });
    await newScore.save();
    console.log('Score saved:', newScore);
    res.status(201).json({ message: 'Score submitted successfully', data: newScore });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// API to get all scores
app.get('/api/scores', async (req, res) => {
  console.log('Received GET /api/scores');
  try {
    const scores = await Score.find().sort({ timestamp: -1 }).limit(100);
    res.json(scores);
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Use Render's assigned port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
