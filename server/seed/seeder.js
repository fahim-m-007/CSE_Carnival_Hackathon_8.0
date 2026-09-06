import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Course from '../models/Course.js';
import StudentScript from '../models/StudentScript.js';
import { SEED_FACULTY_USERS, getSeedCourses, extractStudentScripts } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export async function seedDatabase(force = false) {
  console.log('🌱 Starting MongoDB Atlas Database Seeding...');

  try {
    const courses = getSeedCourses();
    const scripts = extractStudentScripts(courses);

    if (force) {
      console.log('🧹 Purging existing collections...');
      await User.deleteMany({});
      await Course.deleteMany({});
      await StudentScript.deleteMany({});
    }

    // 1. Seed Faculty Users
    for (const faculty of SEED_FACULTY_USERS) {
      await User.findOneAndUpdate(
        { email: faculty.email.toLowerCase() },
        faculty,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`✅ Seeded ${SEED_FACULTY_USERS.length} faculty users.`);

    // 2. Seed Courses
    for (const course of courses) {
      await Course.findOneAndUpdate(
        { id: course.id },
        course,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`✅ Seeded ${courses.length} departmental courses with rubrics.`);

    // 3. Seed Student Scripts
    for (const script of scripts) {
      await StudentScript.findOneAndUpdate(
        { id: script.id },
        script,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`✅ Seeded ${scripts.length} student submission scripts.`);

    console.log('🎉 Seeding completed successfully!');
    return { users: SEED_FACULTY_USERS.length, courses: courses.length, scripts: scripts.length };
  } catch (error) {
    console.error('❌ Database Seeding Error:', error);
    throw error;
  }
}

export async function autoSeedIfEmpty() {
  const courseCount = await Course.countDocuments();
  if (courseCount === 0) {
    console.log('📦 Database appears empty. Running initial auto-seed...');
    await seedDatabase(false);
  } else {
    console.log(`ℹ️  Database contains ${courseCount} courses. Auto-seed skipped.`);
  }
}

// Standalone CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gradecalibrate';
  console.log(`Connecting to ${uri.replace(/\/\/.*@/, '//<hidden-auth>@')}...`);
  
  mongoose.connect(uri)
    .then(async () => {
      const force = process.argv.includes('--force') || process.argv.includes('-f');
      await seedDatabase(force);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to seed:', err.message);
      process.exit(1);
    });
}
