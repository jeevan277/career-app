const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(token, 'secret123');
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Career matching logic
const getResults = (answers) => {
  const scores = {};
  Object.values(answers).forEach(({ category, value }) => {
    scores[category] = (scores[category] || 0) + value;
  });

  const careers = [
    { title: 'Software Engineer', categories: ['technical', 'analytical'], description: 'Build apps, websites and software systems' },
    { title: 'Data Scientist', categories: ['analytical', 'academic'], description: 'Analyze data to find insights and patterns' },
    { title: 'Doctor / Healthcare', categories: ['social', 'academic'], description: 'Help people with health and medical care' },
    { title: 'Psychologist', categories: ['social', 'academic'], description: 'Study and support human mental health' },
    { title: 'Graphic Designer', categories: ['creative', 'technical'], description: 'Create visual content and designs' },
    { title: 'Teacher / Educator', categories: ['social', 'leadership'], description: 'Educate and inspire the next generation' },
    { title: 'Entrepreneur', categories: ['leadership', 'independent'], description: 'Start and run your own business' },
    { title: 'Civil Engineer', categories: ['practical', 'analytical'], description: 'Design and build infrastructure' },
    { title: 'Content Creator', categories: ['creative', 'independent'], description: 'Create content for digital platforms' },
    { title: 'Manager / MBA', categories: ['leadership', 'social'], description: 'Lead teams and manage organizations' }
  ];

  const careerScores = careers.map(career => {
    const fit = career.categories.reduce((sum, cat) => sum + (scores[cat] || 0), 0);
    const maxFit = career.categories.length * 25;
    return { title: career.title, description: career.description, fit: Math.min(Math.round((fit / maxFit) * 100), 99) };
  });

  careerScores.sort((a, b) => b.fit - a.fit);

  const topCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];

  const streams = {
    technical: { name: '💻 Science (Computer Science)', description: 'Focus on technology and programming', subjects: ['Math', 'Physics', 'Computer Science', 'English'] },
    analytical: { name: '🔬 Science (Pure)', description: 'Focus on research and analysis', subjects: ['Math', 'Physics', 'Chemistry', 'Biology'] },
    social: { name: '🧠 Arts / Humanities', description: 'Focus on people and society', subjects: ['Psychology', 'Sociology', 'English', 'History'] },
    creative: { name: '🎨 Fine Arts / Design', description: 'Focus on creativity and expression', subjects: ['Fine Arts', 'Design', 'English', 'Media Studies'] },
    leadership: { name: '💼 Commerce', description: 'Focus on business and management', subjects: ['Accountancy', 'Business Studies', 'Economics', 'Math'] },
    academic: { name: '📚 Science (Medical)', description: 'Focus on medicine and research', subjects: ['Biology', 'Chemistry', 'Physics', 'Math'] },
    practical: { name: '🔧 Vocational / Engineering', description: 'Focus on hands-on technical skills', subjects: ['Math', 'Physics', 'Workshop', 'Technical Drawing'] },
    independent: { name: '🌍 Liberal Arts', description: 'Focus on broad knowledge and self-development', subjects: ['English', 'Geography', 'Economics', 'Psychology'] }
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
    `Focus on ${careerScores[0].title} foundations — take online courses and build basics`,
    `Complete a diploma or degree related to ${careerScores[0].title}`,
    `Do internships and build real projects for your portfolio`,
    `Get certified and apply for entry-level ${careerScores[0].title} jobs`,
    `Grow into a senior role and consider specialization or entrepreneurship`
  ];

  return { careers: careerScores.slice(0, 5), traits, stream: streams[topCategory] || streams.academic, actionPlan };
};

router.post('/submit', auth, (req, res) => {
  const { answers } = req.body;
  const results = getResults(answers);
  res.json(results);
});

module.exports = router;