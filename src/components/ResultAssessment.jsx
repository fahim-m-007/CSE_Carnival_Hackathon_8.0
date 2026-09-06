import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Layers,
  Lock
} from 'lucide-react';
import { assessScriptWithAI } from '../services/aiAssessmentService';

export function ResultAssessment({
  studentScripts,
  setStudentScripts,
  course,
  selectedSection,
  onSelectSection,
  rubricCriteria,
  penalties,
  question,
  currentUser,
  isRubricLocked
}) {
  const sectionScripts = studentScripts.filter(s => s.section === selectedSection);
  const visibleScripts = sectionScripts.length > 0 ? sectionScripts : studentScripts;

  const [selectedStudentId, setSelectedStudentId] = useState(
    visibleScripts[0]?.id || studentScripts[0]?.id
  );
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Active student guaranteed to belong to visible section if possible
  const currentStudent = visibleScripts.find(s => s.id === selectedStudentId) || visibleScripts[0] || studentScripts[0];
  const currentSectionObj = course.sections.find(s => s.id === selectedSection) || course.sections[0];
  const isSectionTeacher = currentStudent ? (currentStudent.sectionTeacher === currentUser.name || currentStudent.section === selectedSection) : false;

  // AI Evaluation against the Locked Rubric
  const handleRunAiEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const evalResult = await assessScriptWithAI({
        scriptCode: currentStudent.submittedCode,
        rubric: rubricCriteria,
        penalties: penalties,
        sectionNotes: question.sectionSpecificAllowances?.[currentStudent.section] || '',
        courseInCharge: currentUser.name
      });

      if (evalResult) {
        setStudentScripts(prev =>
          prev.map(s => {
            if (s.id === currentStudent.id) {
              const base = evalResult.totalAwarded;
              return {
                ...s,
                baseAiScore: base,
                breakdown: evalResult.breakdown,
                feedbackNote: evalResult.feedbackNote,
                finalMarks: Number((base + (s.courseTeacherAdjustment || 0)).toFixed(1))
              };
            }
            return s;
          })
        );
      }
    } catch (err) {
      console.error("AI assessment failed:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Course Teacher applies Class Context Adjustment
  const handleApplyAdjustment = (deltaMarks, reasonText) => {
    const marksToAdd = parseFloat(deltaMarks) || 0;
    setStudentScripts(prev =>
      prev.map(s => {
        if (s.id === currentStudent.id) {
          const newFinal = Math.min(s.maxMarks, Math.max(0, s.baseAiScore + marksToAdd));
          return {
            ...s,
            courseTeacherAdjustment: marksToAdd,
            adjustmentReason: reasonText || "Class Context Allowance granted by Course Teacher.",
            finalMarks: Number(newFinal.toFixed(1)),
            status: "APPROVED"
          };
        }
        return s;
      })
    );
  };

  // Export full result sheet to CSV
  const handleExportCSV = () => {
    const headers = ["Student ID", "Student Name", "Section", "Course Teacher", "Base AI Score", "Teacher Adjustment", "Final Awarded", "Status"];
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
    link.setAttribute("download", `${course.code}_${course.batch}_Result_Sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Intro Banner */}
      <div className="page-intro-banner">
        <div className="page-intro-content">
          <h2>AI Assessment & Student Result Sheet</h2>
          <p>
            Automated script evaluation powered by the <strong>Locked Rubric Standard</strong>.
            The Course Teacher conducts final moderation to ensure section-specific teaching allowances
            are respected before publishing results.
          </p>
        </div>
        <div className="banner-stats">
          <div className="banner-stat-box">
            <span className="banner-stat-num">{studentScripts.length}</span>
            <span className="banner-stat-label">Scripts Assessed</span>
          </div>
          <div className="banner-stat-box">
            <span className="banner-stat-num">
              {studentScripts.filter(s => s.status === 'APPROVED').length} / {studentScripts.length}
            </span>
            <span className="banner-stat-label">Moderated & Signed</span>
          </div>
        </div>
      </div>

      {!isRubricLocked && (
        <div style={{
          background: 'var(--aust-amber-light)',
          border: '1.5px solid var(--aust-amber-border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--aust-amber)'
        }}>
          <AlertTriangle size={20} />
          <div style={{ fontSize: '0.88rem' }}>
            <strong>Notice:</strong> The Rubric is currently unlocked. We recommend locking the rubric in <strong>Rubric Studio</strong> before running final batch assessments across sections.
          </div>
        </div>
      )}

      {/* Interactive Section Switcher for Student Scripts */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: 'var(--aust-white)',
        border: '1px solid var(--aust-slate-200)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 16px',
        marginBottom: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--aust-green)" />
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--aust-slate-800)' }}>
              Section Script Filter:
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--aust-slate-500)', marginLeft: '6px' }}>
              Switch sections to view preloaded student scripts from JSON
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {course.sections.map((sec) => {
            const isCurrentSec = (selectedSection === sec.id);
            const count = studentScripts.filter(s => s.section === sec.id).length;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  if (onSelectSection) onSelectSection(sec.id);
                  const firstOfSec = studentScripts.find(s => s.section === sec.id);
                  if (firstOfSec) setSelectedStudentId(firstOfSec.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: isCurrentSec ? 800 : 600,
                  background: isCurrentSec ? 'var(--aust-green)' : 'var(--aust-slate-100)',
                  color: isCurrentSec ? '#fff' : 'var(--aust-slate-700)',
                  border: isCurrentSec ? '1.5px solid var(--aust-green-dark)' : '1px solid var(--aust-slate-300)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{sec.name}</span>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isCurrentSec ? 'rgba(255,255,255,0.28)' : 'var(--aust-slate-200)',
                  color: isCurrentSec ? '#fff' : 'var(--aust-slate-600)',
                  fontWeight: 700
                }}>
                  {count} scripts
                </span>
                <span style={{ fontSize: '0.72rem', opacity: isCurrentSec ? 0.9 : 0.7 }}>
                  ({sec.teacherName})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Student Selector Bar */}
      <div className="student-script-selector">
        {visibleScripts.map((student) => (
          <button
            key={student.id}
            onClick={() => setSelectedStudentId(student.id)}
            className={`student-pill-btn ${currentStudent?.id === student.id ? 'active' : ''}`}
          >
            <FileText size={16} />
            <span>{student.studentName} ({student.studentId})</span>
            <span className="tab-badge">{student.sectionName}</span>
            {student.courseTeacherAdjustment > 0 && (
              <span style={{
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'var(--aust-amber)',
                color: '#fff',
                fontWeight: 700
              }}>
                +{student.courseTeacherAdjustment.toFixed(1)} Adjusted
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid-2">
        {/* Left: Script Code Viewer & Course Teacher Adjustment */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <FileText size={20} color="var(--aust-green)" />
                <span>Student Submission Script</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="brand-badge">{currentStudent.sectionName}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--aust-slate-600)' }}>
                  ID: <strong>{currentStudent.studentId}</strong>
                </span>
              </div>
            </div>

            <pre className="code-display-block">
              <code>{currentStudent.submittedCode}</code>
            </pre>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={handleRunAiEvaluation}
                className="btn-primary"
                disabled={isEvaluating}
              >
                <Sparkles size={16} />
                <span>{isEvaluating ? 'AI Assessing with Locked Rubric...' : 'Run AI Rubric Assessment'}</span>
              </button>

              <span style={{ fontSize: '0.8rem', color: 'var(--aust-slate-500)' }}>
                Locked Rubric Evaluator
              </span>
            </div>
          </div>

          {/* Course Teacher Final Moderation Authority */}
          <div className="moderation-authority-card">
            <div className="moderation-authority-header">
              <div className="authority-title">
                <ShieldCheck size={22} color="var(--aust-green)" />
                <span>Course Teacher Final Moderation</span>
              </div>
              <span className="instructor-badge">
                {currentStudent.sectionTeacher} ({currentStudent.sectionName})
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--aust-slate-700)', marginBottom: '12px' }}>
              {isSectionTeacher ? (
                <span>
                  You are the <strong>Course Teacher for {currentStudent.sectionName}</strong>. If this student lost marks because the question setter did not recognize a notation or method taught in your classroom lectures, you have the department authority to adjust marks here with a recorded reason.
                </span>
              ) : (
                <span>
                  Viewing {currentStudent.sectionName} script. Course-In-Charge: <strong>{currentStudent.sectionTeacher}</strong>.
                </span>
              )}
            </p>

            <div className="adjustment-controls">
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--aust-slate-800)' }}>
                Class Context Allowance:
              </span>

              <div className="adjustment-btn-group">
                <button
                  onClick={() => handleApplyAdjustment(0, "")}
                  className={`adjust-btn ${currentStudent.courseTeacherAdjustment === 0 ? 'active' : ''}`}
                >
                  0.0 (Standard)
                </button>
                <button
                  onClick={() => handleApplyAdjustment(0.5, "Class Context: Covered boundary tolerance in lecture.")}
                  className={`adjust-btn ${currentStudent.courseTeacherAdjustment === 0.5 ? 'active' : ''}`}
                >
                  +0.5 Mark
                </button>
                <button
                  onClick={() => handleApplyAdjustment(1.0, "Class Context: Accepted alternative notation per Week 4 lecture.")}
                  className={`adjust-btn ${currentStudent.courseTeacherAdjustment === 1.0 ? 'active' : ''}`}
                >
                  +1.0 Mark
                </button>
                <button
                  onClick={() => handleApplyAdjustment(1.5, "Class Context: In-place recursive helper method authorized by Prof. Tariq in Section A lecture.")}
                  className={`adjust-btn ${currentStudent.courseTeacherAdjustment === 1.5 ? 'active' : ''}`}
                >
                  +1.5 Marks (Class Allowance)
                </button>
              </div>
            </div>

            {currentStudent.adjustmentReason && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                color: '#166534'
              }}>
                <strong>Recorded Instructor Note:</strong> "{currentStudent.adjustmentReason}"
              </div>
            )}
          </div>
        </div>

        {/* Right: Dispute-Proof Student Feedback Slip */}
        <div>
          <div className="student-inspection-card">
            <div className="inspection-card-header">
              <div>
                <span className="brand-badge" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  AUST CSE Assessment Slip
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aust-slate-900)' }}>
                  {currentStudent.studentName}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--aust-slate-500)' }}>
                  ID: {currentStudent.studentId} • {currentStudent.sectionName}
                </div>
              </div>

              <div className="score-display-highlight">
                <div className="total-score-value">
                  {currentStudent.finalMarks.toFixed(1)}
                  <span style={{ fontSize: '1.2rem', color: 'var(--aust-slate-400)', fontWeight: 600 }}>
                    {' '}/ {currentStudent.maxMarks.toFixed(1)}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--aust-slate-500)', textTransform: 'uppercase' }}>
                  Awarded Marks
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--aust-slate-800)', marginBottom: '8px' }}>
              Locked Rubric Itemization & Partial Mark Accounting
            </h4>

            <table className="score-breakdown-table">
              <thead>
                <tr>
                  <th>Criterion</th>
                  <th>Awarded</th>
                  <th>AI Assessment Explanation</th>
                </tr>
              </thead>
              <tbody>
                {currentStudent.breakdown.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--aust-slate-800)' }}>
                      {item.title}
                    </td>
                    <td style={{
                      fontWeight: 800,
                      color: item.awarded > 0 ? 'var(--aust-green-dark)' : 'var(--aust-red)'
                    }}>
                      {item.awarded > 0 ? `+${item.awarded.toFixed(1)}` : `${item.awarded.toFixed(1)}`}
                      {item.max > 0 && <span style={{ color: 'var(--aust-slate-400)', fontWeight: 500 }}> / {item.max.toFixed(1)}</span>}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--aust-slate-600)' }}>
                      {item.comment}
                    </td>
                  </tr>
                ))}

                {currentStudent.courseTeacherAdjustment > 0 && (
                  <tr style={{ background: 'var(--aust-green-light)' }}>
                    <td style={{ fontWeight: 700, color: 'var(--aust-green-dark)' }}>
                      Course Teacher Adjustment
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--aust-green-dark)' }}>
                      +{currentStudent.courseTeacherAdjustment.toFixed(1)}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--aust-green-dark)', fontWeight: 500 }}>
                      {currentStudent.adjustmentReason}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{
              background: 'var(--aust-slate-50)',
              border: '1px solid var(--aust-slate-200)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--aust-slate-500)', marginBottom: '4px' }}>
                Script Viewing Day Student Note:
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--aust-slate-800)', lineHeight: '1.5' }}>
                "{currentStudent.feedbackNote}"
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="audit-tag">
                ✓ Signed off by {currentStudent.sectionTeacher} ({currentStudent.status})
              </span>
              <button
                onClick={() => window.print()}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <Printer size={14} />
                <span>Print Inspection Slip</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Result Sheet & Export */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <FileText size={20} color="var(--aust-green)" />
            <span>Complete Batch Result Sheet ({course.batch} • {course.code})</span>
          </div>

          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={16} />
            <span>Export Official Result Sheet (CSV)</span>
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
              <th>Status</th>
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
