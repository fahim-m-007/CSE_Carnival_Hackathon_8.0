// Course Service - Centralized Access Control & Backend-Ready Course Management
import { CSE_22_COURSES, getAllCourses as getLocalAllCourses } from '../data/courses/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Checks if a teacher user is assigned to a course as either:
 * 1. Course Creator / Course In-Charge
 * 2. Section Teacher for at least one section
 * 3. An invited co-teacher
 */
export function isUserAssignedToCourse(course, user) {
  if (!course || !user) return false;

  // 1. Check Creator ID or Name
  if (course.creatorId === user.id || course.creatorName?.toLowerCase() === user.name?.toLowerCase()) {
    return true;
  }

  // 2. Check Sections
  const isSectionTeacher = (course.sections || []).some(sec =>
    sec.teacherId === user.id ||
    sec.teacherName?.toLowerCase() === user.name?.toLowerCase() ||
    (user.email && sec.teacherEmail?.toLowerCase() === user.email?.toLowerCase())
  );
  if (isSectionTeacher) return true;

  // 3. Check Pending or Accepted Invitations
  const isInvited = (course.invitations || []).some(inv =>
    (user.email && inv.inviteeEmail?.toLowerCase() === user.email?.toLowerCase()) ||
    inv.inviteeName?.toLowerCase() === user.name?.toLowerCase()
  );
  if (isInvited) return true;

  return false;
}

/**
 * Returns list of sections that the user is directly assigned to conduct.
 */
export function getAssignedSectionsForTeacher(course, user) {
  if (!course || !user) return [];

  return (course.sections || []).filter(sec =>
    sec.teacherId === user.id ||
    sec.teacherName?.toLowerCase() === user.name?.toLowerCase() ||
    (user.email && sec.teacherEmail?.toLowerCase() === user.email?.toLowerCase())
  );
}

/**
 * Checks if the user is the Course In-Charge / Coordinator for the course.
 */
export function isCourseInCharge(course, user) {
  if (!course || !user) return false;

  if (course.creatorId === user.id || course.creatorName?.toLowerCase() === user.name?.toLowerCase()) {
    return true;
  }

  return (course.sections || []).some(sec =>
    (sec.teacherId === user.id || sec.teacherName?.toLowerCase() === user.name?.toLowerCase()) &&
    sec.role?.toLowerCase().includes("in-charge")
  );
}

/**
 * Checks if the user has moderation and grade adjustment authority for a specific section.
 * Authority is granted IF:
 * 1. The user is the specific teacher assigned to that section.
 * 2. OR the user is the designated Course In-Charge for the whole course.
 */
export function canTeacherModerateSection(course, sectionId, user) {
  if (!course || !user) return false;

  // Course In-Charge has overarching moderation rights
  if (isCourseInCharge(course, user)) {
    return true;
  }

  // Otherwise, user must be the assigned instructor for this specific section
  const targetSection = (course.sections || []).find(s => s.id === sectionId);
  if (!targetSection) return false;

  return (
    targetSection.teacherId === user.id ||
    targetSection.teacherName?.toLowerCase() === user.name?.toLowerCase() ||
    (user.email && targetSection.teacherEmail?.toLowerCase() === user.email?.toLowerCase())
  );
}

/**
 * Fetch all courses assigned to the logged-in user.
 * Connects to backend if API URL exists, otherwise filters local JSON courses.
 */
export async function getCoursesForUser(user) {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses?teacherId=${user.id}`, {
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend API not reachable, falling back to local JSON database.", e);
    }
  }

  const all = getLocalAllCourses();
  return all.filter(course => isUserAssignedToCourse(course, user));
}

/**
 * Get all department courses (for catalog view with access badges).
 */
export async function getAllDepartmentCourses() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/all`, {
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend API not reachable, falling back to local JSON database.", e);
    }
  }

  return getLocalAllCourses();
}
