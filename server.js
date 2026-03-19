require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// User Model
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', UserSchema);

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    await new User({ name, email, password: hashed }).save();
    res.json({ message: 'Registration successful' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Wrong password' });
    const token = jwt.sign({ id: user._id }, 'secret123', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Assessment Submit
app.post('/api/assessment/submit', (req, res) => {
  const { answers } = req.body;
  const scores = {};
  Object.values(answers).forEach(({ category, value }) => {
    scores[category] = (scores[category] || 0) + value;
  });

  const careers = [
    { title: 'Software Engineer', categories: ['technical', 'analytical'], description: 'Build apps and software systems' },
    { title: 'Data Scientist', categories: ['analytical', 'academic'], description: 'Analyze data to find insights' },
    { title: 'Doctor', categories: ['social', 'academic'], description: 'Help people with medical care' },
    { title: 'Psychologist', categories: ['social', 'academic'], description: 'Support human mental health' },
    { title: 'Graphic Designer', categories: ['creative', 'technical'], description: 'Create visual content' },
    { title: 'Teacher', categories: ['social', 'leadership'], description: 'Educate and inspire others' },
    { title: 'Entrepreneur', categories: ['leadership', 'independent'], description: 'Start your own business' },
    { title: 'Civil Engineer', categories: ['practical', 'analytical'], description: 'Design and build infrastructure' },
    { title: 'Content Creator', categories: ['creative', 'independent'], description: 'Create digital content' },
    { title: 'Manager', categories: ['leadership', 'social'], description: 'Lead teams and organizations' }
  ];

  const careerScores = careers.map(career => {
    const fit = career.categories.reduce((sum, cat) => sum + (scores[cat] || 0), 0);
    const maxFit = career.categories.length * 25;
    return { title: career.title, description: career.description, fit: Math.min(Math.round((fit / maxFit) * 100), 99) };
  }).sort((a, b) => b.fit - a.fit);

  const topCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];

  const streams = {
    technical: { name: '💻 Science (Computer Science)', description: 'Focus on technology', subjects: ['Math', 'Physics', 'Computer Science', 'English'] },
    analytical: { name: '🔬 Science (Pure)', description: 'Focus on research', subjects: ['Math', 'Physics', 'Chemistry', 'Biology'] },
    social: { name: '🧠 Arts / Humanities', description: 'Focus on people', subjects: ['Psychology', 'Sociology', 'English', 'History'] },
    creative: { name: '🎨 Fine Arts', description: 'Focus on creativity', subjects: ['Fine Arts', 'Design', 'English', 'Media'] },
    leadership: { name: '💼 Commerce', description: 'Focus on business', subjects: ['Accountancy', 'Business', 'Economics', 'Math'] },
    academic: { name: '📚 Science (Medical)', description: 'Focus on medicine', subjects: ['Biology', 'Chemistry', 'Physics', 'Math'] },
    practical: { name: '🔧 Vocational', description: 'Focus on technical skills', subjects: ['Math', 'Physics', 'Workshop', 'Drawing'] },
    independent: { name: '🌍 Liberal Arts', description: 'Broad knowledge', subjects: ['English', 'Geography', 'Economics', 'Psychology'] }
  };

  const traits = [
    { name: 'Analytical', emoji: '🔍', categories: ['analytical', 'technical'] },
    { name: 'Creative', emoji: '🎨', categories: ['creative'] },
    { name: 'Social', emoji: '🤝', categories: ['social'] },
    { name: 'Leader', emoji: '👑', categories: ['leadership'] },
    { name: 'Independent', emoji: '🦅', categories: ['independent'] },
    { name: 'Practical', emoji: '🔧', categories: ['practical'] }
  ].filter(trait => trait.categories.some(cat => (scores[cat] || 0) > 10));

  const actionPlan = [
    `Focus on ${careerScores[0].title} foundations and take online courses`,
    `Complete a degree related to ${careerScores[0].title}`,
    `Do internships and build real projects`,
    `Get certified and apply for entry-level jobs`,
    `Grow into a senior role and specialize`
  ];

  res.json({ careers: careerScores.slice(0, 5), traits, stream: streams[topCategory] || streams.academic, actionPlan });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.listen(process.env.PORT || 5000, () => console.log('Server running on port ' + (process.env.PORT || 5000)));