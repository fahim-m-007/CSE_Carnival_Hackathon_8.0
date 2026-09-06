// Course Service - Centralized Access Control & Backend-Connected Course Management
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
 */
export function canTeacherModerateSection(course, sectionId, user) {
  if (!course || !user) return false;

  if (isCourseInCharge(course, user)) {
    return true;
  }

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
 * Connects to MongoDB backend via proxy, with graceful local fallback.
 */
export async function getCoursesForUser(user) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/courses?teacherId=${user?.id || ''}&email=${encodeURIComponent(user?.email || '')}&name=${encodeURIComponent(user?.name || '')}`, {
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Backend API not reachable, using local catalog.", e);
  }

  const all = getLocalAllCourses();
  return all.filter(course => isUserAssignedToCourse(course, user));
}

/**
 * Get all department courses.
 */
export async function getAllDepartmentCourses() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/courses/all`, {
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Backend API not reachable, using local catalog.", e);
  }

  return getLocalAllCourses();
}

/**
 * Fetch single course by ID.
 */
export async function getCourseByIdFromBackend(courseId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}`, {
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Could not fetch course from backend:", e);
  }
  return null;
}

/**
 * Create a new course in the backend.
 */
export async function createCourseOnBackend(courseData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Could not save course to backend:", e);
  }
  return courseData;
}

/**
 * Update course in backend (rubric, question, penalties, lock state).
 */
export async function updateCourseOnBackend(courseId, updateData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Could not update course on backend:", e);
  }
  return updateData;
}

/**
 * Check backend and MongoDB connection status.
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (res.ok) return await res.json();
  } catch (e) {
    return { status: 'offline', error: e.message };
  }
  return { status: 'offline' };
}
