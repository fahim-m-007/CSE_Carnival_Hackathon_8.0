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
  GraduationCap
} from 'lucide-react';

export function TeacherDashboard({
  currentUser,
  courses,
  onSelectCourse,
  onOpenCreateModal
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'my'

  // Find courses where currentUser is creator or section teacher
  const myCourses = courses.filter(c =>
    c.creatorId === currentUser.id ||
    c.sections.some(s => s.teacherId === currentUser.id || s.teacherName === currentUser.name)
  );

  const displayedCourses = filterMode === 'my' ? myCourses : courses;

  const totalSections = courses.reduce((acc, c) => acc + (c.sections?.length || 0), 0);

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
      <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aust-slate-900)' }}>
            AUST CSE 2.2 Semester Courses & Sections
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--aust-slate-500)' }}>
            Preloaded from JSON: Select a course to configure exam rubrics, penalty rules, or assess preloaded student scripts across sections.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
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
            All CSE 2.2 Courses ({courses.length})
          </button>
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
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="course-cards-grid">
        {displayedCourses.map((course) => {
          const isCreator = course.creatorId === currentUser.id;
          const isTeacher = course.sections?.some(s => s.teacherId === currentUser.id || s.teacherName === currentUser.name);

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

                <span className={`role-chip ${isCreator ? 'creator' : isTeacher ? 'coteacher' : 'department'}`}>
                  {isCreator ? 'Course In-Charge' : isTeacher ? 'Co-Teacher' : 'Department Course'}
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
