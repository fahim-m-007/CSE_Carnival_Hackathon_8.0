import express from 'express';
import mongoose from 'mongoose';
import StudentScript from '../models/StudentScript.js';
import { getSeedCourses, extractStudentScripts } from '../seed/seedData.js';

const router = express.Router();

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

let memoryScripts = extractStudentScripts(getSeedCourses());

// @route   GET /api/scripts
// @desc    Get student scripts by courseId and optional section
router.get('/', async (req, res) => {
  try {
    const { courseId, section } = req.query;

    if (isDbReady()) {
      const filter = {};
      if (courseId) filter.courseId = courseId;
      if (section) filter.section = section;

      const dbScripts = await StudentScript.find(filter).sort({ studentId: 1 });
      if (dbScripts && dbScripts.length > 0) {
        return res.json(dbScripts);
      }
    }

    const filtered = memoryScripts.filter(s => {
      if (courseId && s.courseId !== courseId) return false;
      if (section && s.section !== section) return false;
      return true;
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving student scripts', error: err.message });
  }
});

// @route   GET /api/scripts/:id
// @desc    Get a single student script
router.get('/:id', async (req, res) => {
  try {
    if (isDbReady()) {
      const script = await StudentScript.findOne({ id: req.params.id });
      if (script) return res.json(script);
    }

    const found = memoryScripts.find(s => s.id === req.params.id);
    if (!found) {
      return res.status(404).json({ message: 'Script not found' });
    }
    res.json(found);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching script', error: err.message });
  }
});

// @route   POST /api/scripts
// @desc    Create/submit a new student script
router.post('/', async (req, res) => {
  try {
    const scriptData = req.body;
    const newScriptData = {
      id: scriptData.id || `scr_${Date.now()}`,
      courseId: scriptData.courseId,
      studentId: scriptData.studentId,
      studentName: scriptData.studentName,
      section: scriptData.section || 'sec_a',
      sectionName: scriptData.sectionName || 'Section A',
      sectionTeacher: scriptData.sectionTeacher || 'Faculty Member',
      teacherId: scriptData.teacherId,
      submittedCode: scriptData.submittedCode || '',
      baseAiScore: scriptData.baseAiScore || 0,
      maxMarks: scriptData.maxMarks || 5.0,
      status: scriptData.status || 'SUBMITTED',
      evaluatorNotes: scriptData.evaluatorNotes || '',
      breakdown: scriptData.breakdown || [],
      courseTeacherAdjustment: scriptData.courseTeacherAdjustment || 0,
      adjustmentReason: scriptData.adjustmentReason || '',
      finalMarks: scriptData.finalMarks || 0,
      feedbackNote: scriptData.feedbackNote || ''
    };

    memoryScripts.push(newScriptData);

    if (isDbReady()) {
      const newScript = new StudentScript(newScriptData);
      await newScript.save();
      return res.status(201).json(newScript);
    }

    res.status(201).json(newScriptData);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create script', error: err.message });
  }
});

// @route   PUT /api/scripts/:id
// @desc    Update a student script (scores, moderation status, adjustment)
router.put('/:id', async (req, res) => {
  try {
    const updateData = req.body;
    
    // Recalculate finalMarks
    const existingIndex = memoryScripts.findIndex(s => s.id === req.params.id);
    const existing = existingIndex !== -1 ? memoryScripts[existingIndex] : null;

    if (updateData.baseAiScore !== undefined || updateData.courseTeacherAdjustment !== undefined) {
      const base = updateData.baseAiScore !== undefined ? updateData.baseAiScore : (existing?.baseAiScore || 0);
      const adj = updateData.courseTeacherAdjustment !== undefined ? updateData.courseTeacherAdjustment : (existing?.courseTeacherAdjustment || 0);
      const max = updateData.maxMarks !== undefined ? updateData.maxMarks : (existing?.maxMarks || 5.0);
      updateData.finalMarks = Math.min(max, Math.max(0, Number((base + adj).toFixed(1))));
    }

    if (existingIndex !== -1) {
      memoryScripts[existingIndex] = { ...memoryScripts[existingIndex], ...updateData };
    }

    if (isDbReady()) {
      const updated = await StudentScript.findOneAndUpdate(
        { id: req.params.id },
        { $set: updateData },
        { new: true, upsert: true }
      );
      if (updated) return res.json(updated);
    }

    if (existingIndex !== -1) {
      return res.json(memoryScripts[existingIndex]);
    }

    res.status(404).json({ message: 'Script not found' });
  } catch (err) {
    console.error('Update script error:', err);
    res.status(500).json({ message: 'Failed to update student script', error: err.message });
  }
});

// @route   PUT /api/scripts/batch/approve
// @desc    Batch approve all scripts for a section
router.put('/batch/approve', async (req, res) => {
  try {
    const { courseId, section } = req.body;
    if (!courseId || !section) {
      return res.status(400).json({ message: 'courseId and section are required' });
    }

    let modifiedCount = 0;
    memoryScripts = memoryScripts.map(s => {
      if (s.courseId === courseId && s.section === section) {
        modifiedCount++;
        return { ...s, status: 'APPROVED' };
      }
      return s;
    });

    if (isDbReady()) {
      const result = await StudentScript.updateMany(
        { courseId, section },
        { $set: { status: 'APPROVED' } }
      );
      return res.json({ message: `Approved ${result.modifiedCount} scripts for section ${section}` });
    }

    res.json({ message: `Approved ${modifiedCount} scripts for section ${section}` });
  } catch (err) {
    res.status(500).json({ message: 'Batch approval failed', error: err.message });
  }
});

export default router;
