import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  Filter,
  Search,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';

function calculateStdDev(arr, mean) {
  if (!arr || arr.length === 0) return 0;
  const squareDiffs = arr.map(val => Math.pow(val - mean, 2));
  return Math.sqrt(squareDiffs.reduce((sum, d) => sum + d, 0) / arr.length);
}

const SECTION_COLOR_PALETTE = [
  { border: 'var(--aust-green)', bg: 'var(--aust-green-light)', text: 'var(--aust-green-dark)', badgeBg: '#dcfce7', badgeText: '#15803d' },
  { border: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8', badgeBg: '#dbeafe', badgeText: '#1e40af' },
  { border: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9', badgeBg: '#ede9fe', badgeText: '#5b21b6' },
  { border: '#f59e0b', bg: '#fffbeb', text: '#b45309', badgeBg: '#fef3c7', badgeText: '#92400e' },
  { border: '#06b6d4', bg: '#ecfeff', text: '#0e7490', badgeBg: '#cffafe', badgeText: '#155e75' }
];

export function AnalyticsDashboard({ studentScripts = [], courseData = {} }) {
  const [viewMode, setViewMode] = useState('after'); // 'before' or 'after'
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Course metadata
  const courseCode = courseData?.code || 'CSE Course';
  const courseBatch = courseData?.batch || 'Batch 53';
  const courseTerm = courseData?.term || 'Spring 2026';
  const maxMarks = Number(courseData?.question?.totalMarks || studentScripts?.[0]?.maxMarks || 5.0);

  // Derive sections dynamically from courseData.sections or from studentScripts
  const sections = useMemo(() => {
    if (courseData?.sections && courseData.sections.length > 0) {
      return courseData.sections;
    }
    const uniqueSecs = Array.from(new Set(studentScripts.map(s => s.sectionName || s.section || 'Section A')));
    return uniqueSecs.map((secName, idx) => {
      const sample = studentScripts.find(s => (s.sectionName || s.section) === secName);
      return {
        id: sample?.section || `sec_${idx}`,
        name: secName,
        enrolled: studentScripts.filter(s => (s.sectionName || s.section) === secName).length,
        teacherName: sample?.sectionTeacher || 'Faculty Member',
        teacherDesignation: 'Instructor',
        role: 'Section Teacher',
        teachingNotes: 'Department standard'
      };
    });
  }, [courseData, studentScripts]);

  // Compute metrics per section
  const sectionMetrics = useMemo(() => {
    return sections.map((sec, idx) => {
      const colorScheme = SECTION_COLOR_PALETTE[idx % SECTION_COLOR_PALETTE.length];
      const secScripts = studentScripts.filter(s =>
        s.section === sec.id ||
        s.section === sec.name ||
        s.sectionName === sec.name ||
        s.sectionName === sec.id
      );

      const evaluatedCount = secScripts.length;
      const enrolledCount = Number(sec.enrolled) || evaluatedCount;

      // Calibrated Stats (After)
      const calibratedAvg = evaluatedCount > 0
        ? secScripts.reduce((sum, s) => sum + (Number(s.finalMarks) || 0), 0) / evaluatedCount
        : 0;
      const calibratedVariance = calculateStdDev(secScripts.map(s => Number(s.finalMarks) || 0), calibratedAvg);

      // Raw / Pre-Calibration Stats (Before)
      const rawAvg = evaluatedCount > 0
        ? secScripts.reduce((sum, s) => sum + (Number(s.baseAiScore) || 0), 0) / evaluatedCount
        : 0;
      const rawVariance = calculateStdDev(secScripts.map(s => Number(s.baseAiScore) || 0), rawAvg);

      const totalAdjustments = secScripts.reduce((sum, s) => sum + (Number(s.courseTeacherAdjustment) || 0), 0);
      const adjustedScriptsCount = secScripts.filter(s => (Number(s.courseTeacherAdjustment) || 0) > 0).length;
      const approvedCount = secScripts.filter(s => s.status === 'APPROVED').length;

      return {
        ...sec,
        secScripts,
        evaluatedCount,
        enrolledCount,
        calibratedAvg,
        calibratedVariance,
        rawAvg,
        rawVariance,
        totalAdjustments,
        adjustedScriptsCount,
        approvedCount,
        colorScheme
      };
    });
  }, [sections, studentScripts]);

  // Overall Batch Calculations
  const totalEnrolled = useMemo(() => {
    return sections.reduce((sum, s) => sum + (Number(s.enrolled) || 0), 0) || studentScripts.length;
  }, [sections, studentScripts]);

  const totalEvaluated = studentScripts.length;

  // Compute Discrepancy Gaps dynamically
  const { rawGap, calibratedGap, activeGap } = useMemo(() => {
    const activeSections = sectionMetrics.filter(m => m.evaluatedCount > 0);
    if (activeSections.length < 2) {
      return { rawGap: 0, calibratedGap: 0, activeGap: 0 };
    }

    const rawAvgs = activeSections.map(m => m.rawAvg);
    const calAvgs = activeSections.map(m => m.calibratedAvg);

    const rGap = Math.max(...rawAvgs) - Math.min(...rawAvgs);
    const cGap = Math.max(...calAvgs) - Math.min(...calAvgs);

    return {
      rawGap: Number(rGap.toFixed(1)),
      calibratedGap: Number(cGap.toFixed(1)),
      activeGap: viewMode === 'before' ? Number(rGap.toFixed(1)) : Number(cGap.toFixed(1))
    };
  }, [sectionMetrics, viewMode]);

  // Filtered Roster for the Table
  const filteredScripts = useMemo(() => {
    return studentScripts.filter(s => {
      const matchesSection = sectionFilter === 'ALL' ||
        s.section === sectionFilter ||
        s.sectionName === sectionFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        s.studentName?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.sectionTeacher?.toLowerCase().includes(q);

      return matchesSection && matchesSearch;
    });
  }, [studentScripts, sectionFilter, searchQuery]);

  const handleExportCSV = () => {
    const headers = ["Student ID", "Student Name", "Section", "Course Teacher", "Base AI Score", "Teacher Adjustment", "Final Awarded", "Max Marks", "Status"];
    const rows = filteredScripts.map(s => [
      s.studentId,
      `"${s.studentName}"`,
      s.sectionName,
      `"${s.sectionTeacher}"`,
      Number(s.baseAiScore || 0).toFixed(1),
      Number(s.courseTeacherAdjustment || 0).toFixed(1),
      Number(s.finalMarks || 0).toFixed(1),
      Number(s.maxMarks || maxMarks).toFixed(1),
      s.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AUST_${courseCode.replace(/\s+/g, '_')}_${courseBatch.replace(/\s+/g, '_')}_Calibrated_Grades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Intro Banner */}
      <div className="page-intro-banner">
        <div className="page-intro-content">
          <h2>3. Cross-Section Fairness & Analytics</h2>
          <p>
            Statistical grading harmonization across all {sections.length} sections of <strong>{courseCode} ({courseBatch})</strong>.
            Compare raw evaluator variance against the calibrated OBE rubric standard.
          </p>
        </div>
        <div className="banner-stats">
          <div className="banner-stat-box">
            <span className="banner-stat-num">{activeGap.toFixed(1)} M</span>
            <span className="banner-stat-label">Cross-Section Gap</span>
          </div>
          <div className="banner-stat-box">
            <span className="banner-stat-num">{totalEvaluated} / {totalEnrolled}</span>
            <span className="banner-stat-label">Assessed / Enrolled</span>
          </div>
        </div>
      </div>

      {/* Before vs After Calibration Toggle */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="card-title">
            <BarChart3 size={22} color="var(--aust-green)" />
            <span>
              Grading Harmonization Across Sections ({sections.map(s => s.name).join(' vs ')})
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', background: 'var(--aust-slate-100)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              onClick={() => setViewMode('before')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'before' ? 'var(--aust-red)' : 'transparent',
                color: viewMode === 'before' ? '#fff' : 'var(--aust-slate-700)',
                transition: 'all 0.15s ease'
              }}
            >
              ⚠️ Before Calibration ({rawGap.toFixed(1)} M Gap)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('after')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'after' ? 'var(--aust-green)' : 'transparent',
                color: viewMode === 'after' ? '#fff' : 'var(--aust-slate-700)',
                transition: 'all 0.15s ease'
              }}
            >
              ✓ After Calibration ({calibratedGap.toFixed(1)} M Gap)
            </button>
          </div>
        </div>

        {/* Dynamic Section Comparison Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`,
          gap: '16px',
          marginBottom: '24px'
        }}>
          {sectionMetrics.map((sm) => {
            const currentAvg = viewMode === 'before' ? sm.rawAvg : sm.calibratedAvg;
            const currentVariance = viewMode === 'before' ? sm.rawVariance : sm.calibratedVariance;
            const percentage = maxMarks > 0 ? Math.min(100, Math.round((currentAvg / maxMarks) * 100)) : 0;
            const topColor = viewMode === 'before'
              ? (sm.rawAvg < (maxMarks * 0.7) ? 'var(--aust-red)' : '#3b82f6')
              : 'var(--aust-green)';

            return (
              <div
                key={sm.id}
                style={{
                  background: 'var(--aust-white)',
                  border: '1px solid var(--aust-slate-200)',
                  borderTop: `4px solid ${topColor}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span
                      className="brand-badge"
                      style={{
                        background: sm.colorScheme.badgeBg,
                        color: sm.colorScheme.badgeText,
                        borderColor: sm.colorScheme.border
                      }}
                    >
                      {sm.name}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--aust-slate-500)', fontWeight: 600 }}>
                      {sm.enrolledCount} Enrolled ({sm.evaluatedCount} Scripts)
                    </span>
                  </div>

                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--aust-slate-900)' }}>
                    {sm.evaluatedCount > 0 ? currentAvg.toFixed(1) : '—'}
                    <span style={{ fontSize: '1rem', color: 'var(--aust-slate-400)', fontWeight: 600 }}>
                      {' '}/ {maxMarks.toFixed(1)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    height: '6px',
                    background: 'var(--aust-slate-100)',
                    borderRadius: '3px',
                    margin: '8px 0 12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${percentage}%`,
                      background: topColor,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--aust-slate-800)' }}>
                    Instructor: {sm.teacherDesignation ? `${sm.teacherDesignation} ` : ''}{sm.teacherName}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--aust-slate-500)', marginTop: '2px' }}>
                    Role: {sm.role || 'Section Teacher'}
                  </div>
                </div>

                <div style={{
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--aust-slate-100)',
                  fontSize: '0.76rem',
                  color: 'var(--aust-slate-600)'
                }}>
                  {viewMode === 'before' ? (
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--aust-slate-700)' }}>Unmoderated Score: </span>
                      {sm.evaluatedCount > 0 ? `${sm.rawAvg.toFixed(1)} M (Std Dev: ±${currentVariance.toFixed(1)})` : 'Pending evaluation'}
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--aust-green-dark)' }}>OBE Calibrated: </span>
                      {sm.evaluatedCount > 0 ? (
                        sm.totalAdjustments > 0
                          ? `+${sm.totalAdjustments.toFixed(1)} M Context Allowance (${sm.adjustedScriptsCount} adjusted)`
                          : 'Rubric Compliant (0.0 M adjustment)'
                      ) : 'No scripts evaluated'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Fairness Impact Insight */}
        <div style={{
          background: viewMode === 'before' ? 'var(--aust-red-light)' : 'var(--aust-green-light)',
          border: `1.5px solid ${viewMode === 'before' ? 'var(--aust-red-border)' : 'var(--aust-green-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          {viewMode === 'before' ? (
            <AlertCircle size={28} color="var(--aust-red)" style={{ flexShrink: 0 }} />
          ) : (
            <ShieldCheck size={28} color="var(--aust-green-dark)" style={{ flexShrink: 0 }} />
          )}

          <div>
            <h4 style={{
              fontSize: '0.98rem',
              fontWeight: 700,
              color: viewMode === 'before' ? 'var(--aust-red)' : 'var(--aust-green-dark)'
            }}>
              {viewMode === 'before'
                ? `Academic Inequity Detected: ${rawGap.toFixed(1)} Marks Variance Across Sections`
                : `Departmental Harmony Achieved: Cross-Section Gap Moderated to ${calibratedGap.toFixed(1)} Marks`}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--aust-slate-700)', marginTop: '2px', lineHeight: '1.4' }}>
              {viewMode === 'before'
                ? `Prior to rubric calibration, students in different sections faced marking discrepancies of up to ${rawGap.toFixed(1)} marks due to varying teacher strictness and unadjusted partial credits. This discrepancy triggers student disputes on Script Viewing Day.`
                : `With GradeCalibrate's locked OBE rubric synchronization and Course Teacher Context Adjustments, evaluation variance across all ${sections.length} sections (${sections.map(s => s.name).join(', ')}) is harmonized while respecting faculty autonomy.`}
            </p>
          </div>
        </div>
      </div>

      {/* Script Inspection Day Roster Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="card-title">
            <Users size={20} color="var(--aust-green)" />
            <span>Script Viewing Day Roster & Moderation Audit Trail</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Section Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} color="var(--aust-slate-500)" />
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                style={{
                  fontSize: '0.82rem',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--aust-slate-300)',
                  background: 'var(--aust-white)'
                }}
              >
                <option value="ALL">All Sections ({studentScripts.length})</option>
                {sections.map(sec => {
                  const count = studentScripts.filter(s => s.section === sec.id || s.sectionName === sec.name).length;
                  return (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--aust-slate-400)'
              }} />
              <input
                type="text"
                placeholder="Search ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  fontSize: '0.82rem',
                  padding: '6px 10px 6px 30px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--aust-slate-300)',
                  width: '180px'
                }}
              />
            </div>

            <button onClick={handleExportCSV} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <table className="score-breakdown-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Section</th>
              <th>Course Teacher</th>
              <th>Base AI Score</th>
              <th>Teacher Adjustment</th>
              <th>Final Awarded</th>
              <th>Moderation Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredScripts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--aust-slate-500)' }}>
                  No student scripts match the current filter or search criteria.
                </td>
              </tr>
            ) : (
              filteredScripts.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.studentId}</td>
                  <td style={{ fontWeight: 600 }}>{s.studentName}</td>
                  <td>
                    <span className="brand-badge">{s.sectionName || s.section}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--aust-slate-600)' }}>{s.sectionTeacher}</td>
                  <td style={{ fontWeight: 600 }}>{Number(s.baseAiScore || 0).toFixed(1)}</td>
                  <td>
                    {(s.courseTeacherAdjustment || 0) > 0 ? (
                      <span style={{
                        fontWeight: 700,
                        color: 'var(--aust-green-dark)',
                        background: 'var(--aust-green-light)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem'
                      }}>
                        +{Number(s.courseTeacherAdjustment).toFixed(1)} (Class Context)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--aust-slate-400)', fontSize: '0.85rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 900, color: 'var(--aust-green-dark)', fontSize: '1rem' }}>
                    {Number(s.finalMarks || 0).toFixed(1)} / {Number(s.maxMarks || maxMarks).toFixed(1)}
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: s.status === 'APPROVED' ? 'var(--aust-green-light)' : '#fef3c7',
                      color: s.status === 'APPROVED' ? 'var(--aust-green-dark)' : '#b45309',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {s.status === 'APPROVED' ? <CheckCircle size={12} /> : <Clock size={12} />}
                      <span>{s.status === 'APPROVED' ? 'Approved' : 'Pending'}</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
