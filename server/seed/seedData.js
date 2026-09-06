import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root path to frontend courses data
const coursesDir = path.resolve(__dirname, '../../src/data/courses');

function loadCourseJson(folder) {
  const filePath = path.join(coursesDir, folder, 'course.json');
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  }
  return null;
}

export const SEED_FACULTY_USERS = [
  {
    id: "fac_01",
    name: "Prof. Tariq Mahmud",
    email: "tariq.cse@aust.edu",
    password: "password123",
    designation: "Professor",
    department: "Department of Computer Science & Engineering",
    university: "Ahsanullah University of Science and Technology",
    initials: "TM",
    role: "in_charge"
  },
  {
    id: "fac_02",
    name: "Lec. Nusrat Jahan",
    email: "nusrat.cse@aust.edu",
    password: "password123",
    designation: "Lecturer",
    department: "Department of Computer Science & Engineering",
    university: "Ahsanullah University of Science and Technology",
    initials: "NJ",
    role: "faculty"
  },
  {
    id: "fac_03",
    name: "Dr. Kazi Tanvir Ahmed",
    email: "tanvir.cse@aust.edu",
    password: "password123",
    designation: "Associate Professor",
    department: "Department of Computer Science & Engineering",
    university: "Ahsanullah University of Science and Technology",
    initials: "TA",
    role: "faculty"
  }
];

export function getSeedCourses() {
  const courseFolders = ['CSE2201', 'CSE2203', 'CSE2205', 'CSE2207', 'CSE2209'];
  const courses = [];

  for (const folder of courseFolders) {
    const data = loadCourseJson(folder);
    if (data) {
      courses.push(data);
    }
  }

  return courses;
}

export function extractStudentScripts(courses) {
  const scripts = [];
  for (const course of courses) {
    if (!course.sections) continue;
    for (const sec of course.sections) {
      if (!sec.studentScripts) continue;
      for (const scr of sec.studentScripts) {
        scripts.push({
          ...scr,
          courseId: course.id,
          section: scr.section || sec.id,
          sectionName: scr.sectionName || sec.name,
          sectionTeacher: scr.sectionTeacher || sec.teacherName,
          teacherId: scr.teacherId || sec.teacherId
        });
      }
    }
  }
  return scripts;
}
