import React from 'react';
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
  GraduationCap
} from 'lucide-react';

export function TeacherDashboard({
  currentUser,
  courses,
  onSelectCourse,
  onOpenCreateModal
}) {
  // Find courses where currentUser is creator or section teacher
  const myCourses = courses.filter(c =>
    c.creatorId === currentUser.id ||
    c.sections.some(s => s.teacherId === currentUser.id || s.teacherName === currentUser.name)
  );

  const totalSections = myCourses.reduce((acc, c) => {
    const conducted = c.sections.filter(s => s.teacherId === currentUser.id || s.teacherName === currentUser.name);
    return acc + conducted.length;
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

      {/* Metrics Row */}
      <div className="dashboard-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box green">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="metric-number">{myCourses.length}</span>
            <span className="metric-label">Active Courses</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box blue">
            <Layers size={22} />
          </div>
          <div>
            <span className="metric-number">{totalSections}</span>
            <span className="metric-label">Conducted Sections</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box amber">
            <Clock size={22} />
          </div>
          <div>
            <span className="metric-number">1</span>
            <span className="metric-label">Pending Script Moderation</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box purple">
            <Users size={22} />
          </div>
          <div>
            <span className="metric-number">106</span>
            <span className="metric-label">Students Enrolled</span>
          </div>
        </div>
      </div>

      {/* Courses Section Header */}
      <div className="section-title-row">
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aust-slate-900)' }}>
            My Courses & Section Allocations
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--aust-slate-500)' }}>
            Select a course to configure exam rubrics, invite co-teachers, or assess student result sheets.
          </p>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="course-cards-grid">
        {myCourses.map((course) => {
          const isCreator = course.creatorId === currentUser.id;
          const mySections = course.sections.filter(s => s.teacherId === currentUser.id || s.teacherName === currentUser.name);

          return (
            <div key={course.id} className="course-dashboard-card">
              <div className="course-card-top">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="course-code-badge">{course.code}</span>
                    <span className="batch-pill">{course.batch}</span>
                    <span className="term-pill">{course.term}</span>
                  </div>
                  <h4 className="course-card-title">{course.title}</h4>
                </div>

                <span className={`role-chip ${isCreator ? 'creator' : 'coteacher'}`}>
                  {isCreator ? 'Course In-Charge' : 'Co-Teacher'}
                </span>
              </div>

              {/* Sections & Teaching Team */}
              <div className="course-team-section">
                <span className="subhead-label">Sections & Faculty Team:</span>
                <div className="sections-list">
                  {course.sections.map((sec) => (
                    <div key={sec.id} className="section-allocation-pill">
                      <span className="sec-tag">{sec.name}</span>
                      <span className="sec-teacher">
                        {sec.teacherName} ({sec.teacherDesignation})
                      </span>
                    </div>
                  ))}
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
                <button
                  onClick={() => onSelectCourse(course)}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <span>Open Rubric & Assessment</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
