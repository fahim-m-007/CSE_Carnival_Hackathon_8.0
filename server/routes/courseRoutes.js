import express from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import StudentScript from '../models/StudentScript.js';
import { getSeedCourses } from '../seed/seedData.js';

const router = express.Router();

// In-memory cache when DB is not connected yet
let memoryCourses = [...getSeedCourses()];

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

// Helper: attach student scripts to course sections
async function hydrateCourseWithScripts(courseDoc) {
  const course = courseDoc.toObject ? courseDoc.toObject() : { ...courseDoc };
  if (isDbReady()) {
    try {
      const scripts = await StudentScript.find({ courseId: course.id });
      if (scripts && scripts.length > 0) {
        course.sections = (course.sections || []).map(sec => ({
          ...sec,
          studentScripts: scripts.filter(s => s.section === sec.id)
        }));
      }
    } catch (err) {
      // ignore
    }
  }
  return course;
}

// @route   GET /api/courses/all
// @desc    Get all departmental courses
router.get('/all', async (req, res) => {
  try {
    if (isDbReady()) {
      const courses = await Course.find({}).sort({ code: 1 });
      if (courses && courses.length > 0) {
        return res.json(courses);
      }
    }
    res.json(memoryCourses);
  } catch (err) {
    res.json(memoryCourses);
  }
});

// @route   GET /api/courses
// @desc    Get courses (optionally filtered by teacherId)
router.get('/', async (req, res) => {
  try {
    const { teacherId, email, name } = req.query;
    let courses = memoryCourses;

    if (isDbReady()) {
      try {
        const dbCourses = await Course.find({}).sort({ code: 1 });
        if (dbCourses && dbCourses.length > 0) {
          courses = dbCourses;
        }
      } catch (e) {
        // fallback to memory
      }
    }

    if (teacherId || email || name) {
      const filtered = courses.filter(course => {
        // 1. Creator match
        if (teacherId && course.creatorId === teacherId) return true;
        if (name && course.creatorName?.toLowerCase() === name.toLowerCase()) return true;

        // 2. Section teacher match
        const isSectionTeacher = (course.sections || []).some(sec =>
          (teacherId && sec.teacherId === teacherId) ||
          (name && sec.teacherName?.toLowerCase() === name.toLowerCase())
        );
        if (isSectionTeacher) return true;

        // 3. Invitation match
        const isInvited = (course.invitations || []).some(inv =>
          (email && inv.inviteeEmail?.toLowerCase() === email.toLowerCase()) ||
          (name && inv.inviteeName?.toLowerCase() === name.toLowerCase())
        );
        if (isInvited) return true;

        return false;
      });

      return res.json(filtered);
    }

    res.json(courses);
  } catch (err) {
    res.json(memoryCourses);
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course with its student scripts
router.get('/:id', async (req, res) => {
  try {
    let course = null;
    if (isDbReady()) {
      course = await Course.findOne({ id: req.params.id });
    }

    if (!course) {
      course = memoryCourses.find(c => c.id === req.params.id) || memoryCourses[0];
    }

    const hydrated = await hydrateCourseWithScripts(course);
    res.json(hydrated);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving course', error: err.message });
  }
});

// @route   POST /api/courses
// @desc    Create a new course with sections and invitations
router.post('/', async (req, res) => {
  try {
    const courseData = req.body;

    if (!courseData.code || !courseData.title) {
      return res.status(400).json({ message: 'Course code and title are required' });
    }

    const newCourseData = {
      id: courseData.id || `course_${Date.now()}`,
      code: courseData.code.toUpperCase(),
      title: courseData.title,
      batch: courseData.batch || 'Batch 53',
      term: courseData.term || 'Spring 2026',
      creatorId: courseData.creatorId || 'fac_01',
      creatorName: courseData.creatorName || 'Faculty Member',
      question: courseData.question || {
        id: `q_${Date.now()}`,
        number: 'Question 1',
        title: `${courseData.title} Assessment`,
        prompt: 'Standard assessment question prompt.',
        totalMarks: 5.0,
        bloomsLevel: 'Apply / Analyze'
      },
      rubricCriteria: courseData.rubricCriteria || [],
      penalties: courseData.penalties || [],
      sections: courseData.sections || [
        { id: 'sec_a', name: 'Section A', enrolled: 50, role: 'Course In-Charge' }
      ],
      invitations: courseData.invitations || [],
      isRubricLocked: courseData.isRubricLocked ?? true,
      exams: courseData.exams || []
    };

    // Update memory
    memoryCourses.unshift(newCourseData);

    // Save to MongoDB Atlas if connected
    if (isDbReady()) {
      const newCourse = new Course(newCourseData);
      await newCourse.save();
      console.log(`✅ Created course in MongoDB Atlas: ${newCourse.code} - ${newCourse.title}`);
      return res.status(201).json(newCourse);
    }

    res.status(201).json(newCourseData);
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ message: 'Failed to create course in database', error: err.message });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course rubric, question, lock state, penalties, sections
router.put('/:id', async (req, res) => {
  try {
    const updateData = req.body;

    // Update memory
    const idx = memoryCourses.findIndex(c => c.id === req.params.id);
    if (idx !== -1) {
      memoryCourses[idx] = { ...memoryCourses[idx], ...updateData };
    }

    if (isDbReady()) {
      const updated = await Course.findOneAndUpdate(
        { id: req.params.id },
        { $set: updateData },
        { new: true }
      );
      if (updated) return res.json(updated);
    }

    if (idx !== -1) {
      return res.json(memoryCourses[idx]);
    }

    res.status(404).json({ message: 'Course not found' });
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ message: 'Failed to update course', error: err.message });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
router.delete('/:id', async (req, res) => {
  try {
    memoryCourses = memoryCourses.filter(c => c.id !== req.params.id);

    if (isDbReady()) {
      await Course.findOneAndDelete({ id: req.params.id });
      await StudentScript.deleteMany({ courseId: req.params.id });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete course', error: err.message });
  }
});

export default router;
