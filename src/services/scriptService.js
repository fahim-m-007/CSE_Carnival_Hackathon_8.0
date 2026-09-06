// Script Service - Manage Student Exam Submissions, AI Evaluations & Moderation
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Fetch scripts for a course and optional section.
 */
export async function fetchScripts(courseId, section) {
  try {
    const url = new URL(`${window.location.origin}${API_BASE_URL}/api/scripts`);
    if (courseId) url.searchParams.append('courseId', courseId);
    if (section) url.searchParams.append('section', section);

    const res = await fetch(url.toString(), {
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Could not fetch scripts from backend:", err);
  }
  return [];
}

/**
 * Update a student script (scores, teacher adjustments, moderation status).
 */
export async function updateScriptOnBackend(scriptId, updateData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/scripts/${scriptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData)
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Could not update script on backend:", err);
  }
  return updateData;
}

/**
 * Batch approve scripts for a section.
 */
export async function batchApproveSectionScripts(courseId, section) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/scripts/batch/approve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, section })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Could not batch approve scripts on backend:", err);
  }
  return null;
}

/**
 * Create a new student script on the backend.
 */
export async function createScriptOnBackend(scriptData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/scripts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scriptData)
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Could not create script on backend:", err);
  }
  return scriptData;
}

