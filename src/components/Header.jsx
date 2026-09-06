import React from 'react';
import {
  LogOut,
  LayoutDashboard,
  GraduationCap,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export function Header({
  currentUser,
  activeCourse,
  onBackToDashboard,
  onLogout,
  selectedSection,
  onSelectSection
}) {
  const currentSection = activeCourse?.sections.find(s => s.id === selectedSection) || activeCourse?.sections[0];

  return (
    <header className="aust-header">
      <div className="header-inner">
        {/* Brand & Logo */}
        <div className="brand-section">
          <img
            src="/aust-logo.png"
            alt="AUST Official Emblem"
            className="aust-logo-img"
          />
          <div className="brand-title-group">
            <h1>
              <span>Grade</span><span className="brand-accent">Calibrate</span>
              <span className="brand-badge">AUST CSE Final</span>
            </h1>
            <p className="brand-subtitle">
              Department of Computer Science & Engineering • Academic Assessment System
            </p>
          </div>
        </div>

        {/* Header Center / Course Context (if inside a course) */}
        {activeCourse ? (
          <div className="header-actions">
            <button onClick={onBackToDashboard} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
              <LayoutDashboard size={14} />
              <span>Courses Dashboard</span>
            </button>

            <div className="course-context-chip">
              <span className="course-code">{activeCourse.code}</span>
              <span style={{ fontWeight: 600 }}>{activeCourse.title}</span>
              <span style={{ color: 'var(--aust-slate-400)' }}>•</span>
              <span style={{ fontWeight: 700, color: 'var(--aust-slate-700)' }}>{activeCourse.batch}</span>
            </div>

            {/* Section Switcher */}
            <div className="section-selector-wrapper">
              <select
                value={selectedSection}
                onChange={(e) => onSelectSection(e.target.value)}
                title="Active Section Perspective"
              >
                {activeCourse.sections.map((sec) => {
                  const isMySec = sec.teacherId === currentUser.id || sec.teacherName?.toLowerCase() === currentUser.name?.toLowerCase();
                  return (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} — {sec.teacherName} {isMySec ? '• (Your Section)' : '• (View Only)'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        ) : null}

        {/* Faculty Profile & Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="faculty-avatar-small">
              {currentUser.initials || 'FC'}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--aust-slate-900)' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--aust-green-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                <GraduationCap size={12} />
                <span>{currentUser.designation}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--aust-red)' }}
            title="Sign Out"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
