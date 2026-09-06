import mongoose from 'mongoose';

const breakdownItemSchema = new mongoose.Schema({
  criterionId: { type: String, required: true },
  title: { type: String, required: true },
  awarded: { type: Number, required: true },
  max: { type: Number, required: true },
  comment: { type: String }
}, { _id: false });

const studentScriptSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  courseId: {
    type: String,
    required: true,
    index: true
  },
  studentId: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true,
    index: true
  },
  sectionName: {
    type: String,
    default: 'Section A'
  },
  sectionTeacher: {
    type: String
  },
  teacherId: {
    type: String
  },
  submittedCode: {
    type: String,
    default: ''
  },
  baseAiScore: {
    type: Number,
    default: 0
  },
  maxMarks: {
    type: Number,
    default: 5.0
  },
  status: {
    type: String,
    enum: ['APPROVED', 'MODERATION_PENDING', 'AI_EVALUATED', 'SUBMITTED'],
    default: 'SUBMITTED'
  },
  evaluatorNotes: {
    type: String,
    default: ''
  },
  breakdown: [breakdownItemSchema],
  courseTeacherAdjustment: {
    type: Number,
    default: 0
  },
  adjustmentReason: {
    type: String,
    default: ''
  },
  finalMarks: {
    type: Number,
    default: 0
  },
  feedbackNote: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const StudentScript = mongoose.model('StudentScript', studentScriptSchema);
export default StudentScript;
