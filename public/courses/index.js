import cse2201Data from './CSE2201/course.json';
import cse2203Data from './CSE2203/course.json';
import cse2205Data from './CSE2205/course.json';
import cse2207Data from './CSE2207/course.json';
import cse2209Data from './CSE2209/course.json';

export const CSE_22_COURSES = [
  cse2201Data,
  cse2203Data,
  cse2205Data,
  cse2207Data,
  cse2209Data
];

export function getAllCourses() {
  return CSE_22_COURSES;
}

export function getCourseById(courseId) {
  return CSE_22_COURSES.find(c => c.id === courseId) || CSE_22_COURSES[0];
}

export function getCourseByCode(code) {
  return CSE_22_COURSES.find(c => c.code.toLowerCase().replace(/\s+/g, '') === code.toLowerCase().replace(/\s+/g, ''));
}

export function getSectionData(courseId, sectionId) {
  const course = getCourseById(courseId);
  if (!course) return null;
  return course.sections.find(s => s.id === sectionId) || course.sections[0];
}

export function getSectionStudentScripts(courseId, sectionId) {
  const section = getSectionData(courseId, sectionId);
  return section?.studentScripts || [];
}

export default CSE_22_COURSES;
