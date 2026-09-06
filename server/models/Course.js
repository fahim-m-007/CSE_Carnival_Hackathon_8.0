import mongoose from 'mongoose';

const criterionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  weight: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  bloomLevel: { type: String, default: 'Apply' },
  description: { type: String },
  fullCredit: { type: String },
  partialCredit: { type: String },
  zeroCredit: { type: String }
}, { _id: false });

const penaltySchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  deduction: { type: Number, required: true },
  description: { type: String }
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  enrolled: { type: Number, default: 50 },
  teacherId: { type: String },
  teacherName: { type: String },
  teacherDesignation: { type: String },
  role: { type: String, default: 'Section Teacher' },
  teachingNotes: { type: String }
}, { _id: false });

const invitationSchema = new mongoose.Schema({
  inviteeName: { type: String },
  inviteeEmail: { type: String },
  designation: { type: String },
  assignedSection: { type: String },
  role: { type: String }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  id: { type: String },
  number: { type: String, default: 'Question 1' },
  title: { type: String },
  prompt: { type: String },
  totalMarks: { type: Number, default: 5.0 },
  bloomsLevel: { type: String, default: 'Apply / Analyze' },
  authorInstructor: { type: String },
  solutionNotes: { type: String },
  sectionSpecificAllowances: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const courseSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: String,
    default: 'Batch 53'
  },
  term: {
    type: String,
    default: 'Spring 2026'
  },
  creatorId: {
    type: String,
    required: true
  },
  creatorName: {
    type: String,
    required: true
  },
  question: questionSchema,
  rubricCriteria: [criterionSchema],
  penalties: [penaltySchema],
  sections: [sectionSchema],
  invitations: [invitationSchema],
  isRubricLocked: {
    type: Boolean,
    default: true
  },
  exams: [{
    id: String,
    title: String,
    date: String,
    totalMarks: Number,
    questionsCount: Number,
    status: String
  }]
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);
export default Course;
