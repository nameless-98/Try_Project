const express = require('express');
const cors = require('cors');
const pool = require('./db');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Get all exams
app.get('/api/exams', async (req, res) => {
  try {
    const [exams] = await pool.query('SELECT * FROM exams ORDER BY exam_date, start_time');
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Handle root URL by sending index.html

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Add new exam
app.post('/api/exams', async (req, res) => {
  const { course_name, exam_no, exam_date, start_time, duration_minutes, batch } = req.body;
  
  // Validate batch range
  if (batch < 47 || batch > 54) {
    return res.status(400).json({ error: 'Batch must be between 47-54' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO exams (course_name, exam_no, exam_date, start_time, duration_minutes, batch) VALUES (?, ?, ?, ?, ?, ?)',
      [course_name, exam_no, exam_date, start_time, duration_minutes, batch]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add exam' });
  }
});

// Cancel an exam (DELETE)
app.delete('/api/exams/:course/:examNo/:batch', async (req, res) => {
  const { course, examNo, batch } = req.params;
  
  try {
    const [result] = await pool.query(
      'DELETE FROM exams WHERE course_name = ? AND exam_no = ? AND batch = ?',
      [course, examNo, batch]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel exam' });
  }
});

// Reschedule an exam (PUT - update date/time)
app.put('/api/exams/:course/:examNo/:batch/reschedule', async (req, res) => {
  const { course, examNo, batch } = req.params;
  const { new_date, new_time } = req.body;
  
  try {
    const [result] = await pool.query(
      `UPDATE exams 
       SET exam_date = ?, start_time = ?
       WHERE course_name = ? AND exam_no = ? AND batch = ?`,
      [new_date, new_time, course, examNo, batch]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reschedule exam' });
  }
});

// Update exam duration (PATCH)
app.patch('/api/exams/:course/:examNo/:batch/duration', async (req, res) => {
  const { course, examNo, batch } = req.params;
  const { new_duration } = req.body;
  
  try {
    const [result] = await pool.query(
      `UPDATE exams 
       SET duration_minutes = ?
       WHERE course_name = ? AND exam_no = ? AND batch = ?`,
      [new_duration, course, examNo, batch]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update duration' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Webpage: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/exams`);
});