import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { SECTION_ANALYTICS_DATA } from '../data/mockData';

export function AnalyticsDashboard({ studentScripts, courseData }) {
  const [viewMode, setViewMode] = useState('after'); // 'before' or 'after'
  const data = viewMode === 'before' ? SECTION_ANALYTICS_DATA.beforeCalibration : SECTION_ANALYTICS_DATA.afterCalibration;

  const handleExportCSV = () => {
    const headers = ["Student ID", "Student Name", "Section", "Instructor", "Base Score", "Teacher Adjustment", "Final Mark", "Status"];
    const rows = studentScripts.map(s => [
      s.studentId,
      `"${s.studentName}"`,
      s.sectionName,
      `"${s.sectionTeacher}"`,
      s.baseAiScore,
      s.courseTeacherAdjustment,
      s.finalMarks,
      s.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AUST_CSE2101_Batch53_Calibrated_Grades.csv`);
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
            Verify mathematical fairness across all sections of {courseData.batch || 'Batch 53'}. Compare the raw subjective
            grading disparity against the harmonized AI rubric results.
          </p>
        </div>
        <div className="banner-stats">
          <div className="banner-stat-box">
            <span className="banner-stat-num">{data.discrepancyGap.toFixed(1)} M</span>
            <span className="banner-stat-label">Cross-Section Gap</span>
          </div>
          <div className="banner-stat-box">
            <span className="banner-stat-num">160</span>
            <span className="banner-stat-label">Total Batch Scripts</span>
          </div>
        </div>
      </div>

      {/* Before vs After Calibration Toggle */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <BarChart3 size={22} color="var(--aust-green)" />
            <span>Cross-Section Grading Harmonization (Section A vs B vs C)</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', background: 'var(--aust-slate-100)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setViewMode('before')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: viewMode === 'before' ? 'var(--aust-red)' : 'transparent',
                color: viewMode === 'before' ? '#fff' : 'var(--aust-slate-700)'
              }}
            >
              ⚠️ Before Calibration (Discrepant)
            </button>
            <button
              onClick={() => setViewMode('after')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: viewMode === 'after' ? 'var(--aust-green)' : 'transparent',
                color: viewMode === 'after' ? '#fff' : 'var(--aust-slate-700)'
              }}
            >
              ✓ After Calibration (Harmonized)
            </button>
          </div>
        </div>

        {/* Section Comparison Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {/* Section A */}
          <div style={{
            background: 'var(--aust-white)',
            border: '1px solid var(--aust-slate-200)',
            borderTop: `4px solid ${viewMode === 'before' ? 'var(--aust-red)' : 'var(--aust-green)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="brand-badge">Section A</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--aust-slate-500)' }}>54 Enrolled</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--aust-slate-900)' }}>
              {data.sectionA.avg.toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--aust-slate-400)' }}>/ 20.0</span>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--aust-slate-700)', marginTop: '4px' }}>
              Instructor: Prof. Tariq Mahmud
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--aust-slate-500)', marginTop: '2px' }}>
              Condition: {data.sectionA.teacher}
            </div>
          </div>

          {/* Section B */}
          <div style={{
            background: 'var(--aust-white)',
            border: '1px solid var(--aust-slate-200)',
            borderTop: `4px solid ${viewMode === 'before' ? '#3b82f6' : 'var(--aust-green)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="brand-badge" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>Section B</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--aust-slate-500)' }}>52 Enrolled</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--aust-slate-900)' }}>
              {data.sectionB.avg.toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--aust-slate-400)' }}>/ 20.0</span>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--aust-slate-700)', marginTop: '4px' }}>
              Instructor: Lec. Nusrat Jahan
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--aust-slate-500)', marginTop: '2px' }}>
              Condition: {data.sectionB.teacher}
            </div>
          </div>

          {/* Section C */}
          <div style={{
            background: 'var(--aust-white)',
            border: '1px solid var(--aust-slate-200)',
            borderTop: `4px solid ${viewMode === 'before' ? 'var(--aust-red)' : 'var(--aust-green)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="brand-badge">Section C</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--aust-slate-500)' }}>54 Enrolled</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--aust-slate-900)' }}>
              {data.sectionC.avg.toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--aust-slate-400)' }}>/ 20.0</span>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--aust-slate-700)', marginTop: '4px' }}>
              Instructor: Prof. Tariq Mahmud
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--aust-slate-500)', marginTop: '2px' }}>
              Condition: {data.sectionC.teacher}
            </div>
          </div>
        </div>

        {/* Fairness Impact Insight */}
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
                ? "Academic Inequity Detected: 5.1 Marks Grading Disparity"
                : "Departmental Harmony Achieved: Gap Reduced to 0.3 Marks"}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--aust-slate-700)', marginTop: '2px' }}>
              {viewMode === 'before'
                ? "Section A and C students faced severe penalties from strict grading, while Section B enjoyed lenient marking. This caused script-inspection day student disputes."
                : "With GradeCalibrate's rubric synchronization and Course Teacher Context Adjustments, evaluation variance is eliminated across all sections while honoring teacher authority."}
            </p>
          </div>
        </div>
      </div>

      {/* Script Inspection Day Roster Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Users size={20} color="var(--aust-green)" />
            <span>Script Viewing Day Roster & Moderation Audit Trail</span>
          </div>

          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={16} />
            <span>Export Official Grade Sheet (CSV)</span>
          </button>
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
            {studentScripts.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.studentId}</td>
                <td style={{ fontWeight: 600 }}>{s.studentName}</td>
                <td>
                  <span className="brand-badge">{s.sectionName}</span>
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--aust-slate-600)' }}>{s.sectionTeacher}</td>
                <td style={{ fontWeight: 600 }}>{s.baseAiScore.toFixed(1)}</td>
                <td>
                  {s.courseTeacherAdjustment > 0 ? (
                    <span style={{
                      fontWeight: 700,
                      color: 'var(--aust-green-dark)',
                      background: 'var(--aust-green-light)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem'
                    }}>
                      +{s.courseTeacherAdjustment.toFixed(1)} (Class Context)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--aust-slate-400)', fontSize: '0.85rem' }}>—</span>
                  )}
                </td>
                <td style={{ fontWeight: 900, color: 'var(--aust-green-dark)', fontSize: '1rem' }}>
                  {s.finalMarks.toFixed(1)} / {s.maxMarks.toFixed(1)}
                </td>
                <td>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: s.status === 'APPROVED' ? 'var(--aust-green-light)' : '#fef3c7',
                    color: s.status === 'APPROVED' ? 'var(--aust-green-dark)' : '#b45309'
                  }}>
                    {s.status === 'APPROVED' ? '✓ Approved' : '⏳ Moderation Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
