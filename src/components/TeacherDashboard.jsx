import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  Layers,
  Clock,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  GraduationCap,
  Lock,
  UserCheck
} from 'lucide-react';
import { isUserAssignedToCourse, getAssignedSectionsForTeacher, isCourseInCharge } from '../services/courseService';

export function TeacherDashboard({
  currentUser,
  courses,
  onSelectCourse,
  onOpenCreateModal
}) {
  // Default to 'my' so teachers only see what they are assigned to
  const [filterMode, setFilterMode] = useState('my'); // 'my' or 'all'

  // Filter courses assigned to currentUser
  const myCourses = courses.filter(c => isUserAssignedToCourse(c, currentUser));

  const displayedCourses = filterMode === 'my' ? myCourses : courses;

  // Calculate stats strictly for currentUser's assigned sections
  const totalMySections = myCourses.reduce((acc, c) => {
    const assigned = getAssignedSectionsForTeacher(c, currentUser);
    return acc + assigned.length;
  }, 0);

  const totalMyStudents = myCourses.reduce((acc, c) => {
    const assigned = getAssignedSectionsForTeacher(c, currentUser);
    return acc + assigned.reduce((sAcc, s) => sAcc + (s.enrolled || 0), 0);
  }, 0);

  const pendingScriptsCount = myCourses.reduce((acc, c) => {
    const assigned = getAssignedSectionsForTeacher(c, currentUser);
    const assignedIds = new Set(assigned.map(s => s.id));
    const pendingInCourse = (c.sections || [])
      .filter(s => assignedIds.has(s.id) || isCourseInCharge(c, currentUser))
      .flatMap(s => s.studentScripts || [])
      .filter(scr => scr.status !== 'APPROVED').length;
    return acc + pendingInCourse;
  }, 0);

  return (
    <div className="dashboard-container">
      {/* Faculty Profile Welcome Banner */}
      <div className="faculty-hero-banner">
        <div className="faculty-hero-content">
          <div className="faculty-avatar-large">
            {currentUser.initials || 'FC'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="faculty-name">{currentUser.name}</h2>
              <span className="faculty-designation-badge">
                <GraduationCap size={14} />
                <span>{currentUser.designation}</span>
              </span>
            </div>
            <p className="faculty-dept">
              {currentUser.department} • {currentUser.email}
            </p>
          </div>
        </div>

        <button onClick={onOpenCreateModal} className="btn-primary-white">
          <PlusCircle size={18} />
          <span>Initialize New Course</span>
        </button>
      </div>

      {/* Metrics Row (Tailored to logged-in faculty) */}
      <div className="dashboard-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box green">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="metric-number">{myCourses.length}</span>
            <span className="metric-label">My Assigned Courses</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box blue">
            <Layers size={22} />
          </div>
          <div>
            <span className="metric-number">{totalMySections}</span>
            <span className="metric-label">My Assigned Sections</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box amber">
            <Clock size={22} />
          </div>
          <div>
            <span className="metric-number">{pendingScriptsCount}</span>
            <span className="metric-label">Pending Script Moderation</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box purple">
            <Users size={22} />
          </div>
          <div>
            <span className="metric-number">{totalMyStudents}</span>
            <span className="metric-label">My Students Enrolled</span>
          </div>
        </div>
      </div>

      {/* Courses Section Header */}
      <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aust-slate-900)' }}>
            Course Allocations & Assessment Portals
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--aust-slate-500)' }}>
            {filterMode === 'my'
              ? `Displaying ${myCourses.length} courses where you are assigned as Course In-Charge or Section Teacher.`
              : `Displaying all ${courses.length} department courses. Courses you are not assigned to are access-restricted.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setFilterMode('my')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: filterMode === 'my' ? 800 : 600,
              background: filterMode === 'my' ? 'var(--aust-green)' : 'var(--aust-slate-100)',
              color: filterMode === 'my' ? '#fff' : 'var(--aust-slate-700)',
              border: filterMode === 'my' ? '1px solid var(--aust-green-dark)' : '1px solid var(--aust-slate-300)',
              cursor: 'pointer'
            }}
          >
            My Assigned Courses ({myCourses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: filterMode === 'all' ? 800 : 600,
              background: filterMode === 'all' ? 'var(--aust-green)' : 'var(--aust-slate-100)',
              color: filterMode === 'all' ? '#fff' : 'var(--aust-slate-700)',
              border: filterMode === 'all' ? '1px solid var(--aust-green-dark)' : '1px solid var(--aust-slate-300)',
              cursor: 'pointer'
            }}
          >
            All Department Courses ({courses.length})
          </button>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="course-cards-grid">
        {displayedCourses.map((course) => {
          const isAssigned = isUserAssignedToCourse(course, currentUser);
          const inCharge = isCourseInCharge(course, currentUser);
          const assignedSections = getAssignedSectionsForTeacher(course, currentUser);

          return (
            <div
              key={course.id}
              className="course-dashboard-card"
              style={{
                opacity: isAssigned ? 1 : 0.75,
                borderColor: isAssigned ? 'var(--aust-slate-200)' : '#e2e8f0',
                background: isAssigned ? 'var(--aust-white)' : '#fbfcfc'
              }}
            >
              <div className="course-card-top">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="course-code-badge">{course.code}</span>
                    <span className="batch-pill">{course.batch}</span>
                    <span className="term-pill">{course.term}</span>
                  </div>
                  <h4 className="course-card-title">{course.title}</h4>
                </div>

                {isAssigned ? (
                  <span className={`role-chip ${inCharge ? 'creator' : 'coteacher'}`}>
                    {inCharge ? 'Course In-Charge' : `Assigned (${assignedSections.map(s => s.name).join(', ')})`}
                  </span>
                ) : (
                  <span className="role-chip" style={{ background: 'var(--aust-slate-100)', color: 'var(--aust-slate-500)', border: '1px solid var(--aust-slate-300)' }}>
                    🔒 Not Assigned
                  </span>
                )}
              </div>

              {/* Sections & Teaching Team */}
              <div className="course-team-section">
                <span className="subhead-label">Sections & Faculty Team:</span>
                <div className="sections-list">
                  {course.sections.map((sec) => {
                    const isMySec = sec.teacherId === currentUser.id || sec.teacherName?.toLowerCase() === currentUser.name?.toLowerCase();
                    return (
                      <div
                        key={sec.id}
                        className="section-allocation-pill"
                        style={{
                          background: isMySec ? 'var(--aust-green-light)' : 'transparent',
                          padding: isMySec ? '4px 8px' : '2px 0',
                          borderRadius: '4px',
                          border: isMySec ? '1px solid var(--aust-green-border)' : 'none'
                        }}
                      >
                        <span className="sec-tag">{sec.name}</span>
                        <span className="sec-teacher" style={{ fontWeight: isMySec ? 700 : 400, color: isMySec ? 'var(--aust-green-dark)' : 'inherit' }}>
                          {sec.teacherName} ({sec.teacherDesignation}) {isMySec && '• (You)'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Invitations Status */}
              {course.invitations && course.invitations.length > 0 && (
                <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--aust-slate-600)', background: 'var(--aust-green-light)', padding: '6px 10px', borderRadius: '4px' }}>
                  ✓ Shared with: <strong>{course.invitations.map(i => `${i.inviteeName} (${i.assignedSection})`).join(', ')}</strong>
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="course-card-footer">
                <span style={{ fontSize: '0.8rem', color: 'var(--aust-slate-500)' }}>
                  {course.exams?.length || 1} Exam Assessment Active
                </span>

                {isAssigned ? (
                  <button
                    onClick={() => onSelectCourse(course)}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <span>Open Rubric & Assessment</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    disabled
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.82rem',
                      background: 'var(--aust-slate-100)',
                      color: 'var(--aust-slate-400)',
                      border: '1px solid var(--aust-slate-200)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'not-allowed'
                    }}
                    title="You are not assigned to this course. Access restricted."
                  >
                    <Lock size={14} />
                    <span>Access Restricted</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
