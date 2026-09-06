import React, { useState } from 'react';
import {
  CheckCircle,
  FileText,
  UserCheck,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  HelpCircle,
  Send,
  Printer,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { evaluateScriptWithAI } from '../services/geminiService';

export function GradingModeration({
  studentScripts,
  setStudentScripts,
  selectedSection,
  courseData,
  rubricCriteria,
  penalties,
  question
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(studentScripts[1]?.id || studentScripts[0]?.id);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [customAdjustment, setCustomAdjustment] = useState('');
  const [customReason, setCustomReason] = useState('');

  const currentStudent = studentScripts.find(s => s.id === selectedStudentId) || studentScripts[0];
  const currentSection = courseData.sections.find(s => s.id === selectedSection) || courseData.sections[0];
  const isSectionInstructor = currentStudent.section === selectedSection;

  // Re-evaluate current script with AI
  const handleAIEval = async () => {
    setIsEvaluating(true);
    try {
      const evalResult = await evaluateScriptWithAI({
        scriptCode: currentStudent.submittedCode,
        rubric: rubricCriteria,
        penalties: penalties,
        sectionNotes: question.sectionSpecificAllowances?.[currentStudent.section] || '',
        courseInCharge: currentSection.instructor
      });

      if (evalResult) {
        setStudentScripts(prev =>
          prev.map(s => {
            if (s.id === currentStudent.id) {
              const newScore = evalResult.totalAwarded;
              return {
                ...s,
                baseAiScore: newScore,
                breakdown: evalResult.breakdown,
                feedbackNote: evalResult.feedbackNote,
                finalMarks: Number((newScore + (s.courseTeacherAdjustment || 0)).toFixed(1))
              };
            }
            return s;
          })
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Section Teacher applies Class Context Adjustment (User's specific feature)
  const handleApplyAdjustment = (deltaMarks, reasonText) => {
    const marksToAdd = parseFloat(deltaMarks) || 0;
    setStudentScripts(prev =>
      prev.map(s => {
        if (s.id === currentStudent.id) {
          const newFinal = Math.min(s.maxMarks, Math.max(0, s.baseAiScore + marksToAdd));
          return {
            ...s,
            courseTeacherAdjustment: marksToAdd,
            adjustmentReason: reasonText || "Class Context Allowance granted by Course In-Charge.",
            finalMarks: Number(newFinal.toFixed(1)),
            status: "APPROVED"
          };
        }
        return s;
      })
    );
  };

  return (
    <div>
      {/* Intro Banner */}
      <div className="page-intro-banner">
        <div className="page-intro-content">
          <h2>3. Script Evaluation & Course Teacher Moderation</h2>
          <p>
            Standardized grading meets human academic authority. While AI and peer markers grade
            consistently against the rubric, the <strong>Course Teacher who took the class</strong> has the final sign-off
            to grant Class Context Adjustments for section-specific teaching conventions.
          </p>
        </div>
        <div className="banner-stats">
          <div className="banner-stat-box">
            <span className="banner-stat-num">{studentScripts.length}</span>
            <span className="banner-stat-label">Scripts Loaded</span>
          </div>
          <div className="banner-stat-box">
            <span className="banner-stat-num">
              {studentScripts.filter(s => s.status === 'APPROVED').length} / {studentScripts.length}
            </span>
            <span className="banner-stat-label">Signed-off</span>
          </div>
        </div>
      </div>

      {/* Student Selector Bar */}
      <div className="student-script-selector">
        {studentScripts.map((student) => {
          const isSecMatch = student.section === selectedSection;
          return (
            <button
              key={student.id}
              onClick={() => setSelectedStudentId(student.id)}
              className={`student-pill-btn ${selectedStudentId === student.id ? 'active' : ''}`}
            >
              <FileText size={16} />
              <span>{student.studentName} ({student.studentId})</span>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 6px',
                borderRadius: '999px',
                background: selectedStudentId === student.id ? 'rgba(255,255,255,0.25)' : 'var(--aust-slate-100)',
                color: selectedStudentId === student.id ? '#fff' : 'var(--aust-slate-700)'
              }}>
                {student.sectionName}
              </span>
              {student.courseTeacherAdjustment > 0 && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'var(--aust-amber)',
                  color: '#fff',
                  fontWeight: 700
                }}>
                  +{student.courseTeacherAdjustment.toFixed(1)} Adjusted
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left = Student Submission, Right = Rubric Score + Teacher Moderation Card */}
      <div className="grid-2">
        {/* Left Column: Script Submission Viewer */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <FileText size={20} color="var(--aust-green)" />
                <span>Student Answer Script</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="brand-badge">{currentStudent.sectionName}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--aust-slate-600)' }}>
                  ID: <strong>{currentStudent.studentId}</strong>
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <pre className="code-display-block">
                <code>{currentStudent.submittedCode}</code>
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={handleAIEval}
                className="btn-primary"
                disabled={isEvaluating}
              >
                <Sparkles size={16} />
                <span>{isEvaluating ? 'Re-evaluating Script...' : 'Re-Grade Against Locked Rubric'}</span>
              </button>

              <span style={{ fontSize: '0.8rem', color: 'var(--aust-slate-500)' }}>
                Evaluator: Initial Peer / AI Evaluator
              </span>
            </div>
          </div>

          {/* COURSE TEACHER FINAL MODERATION PANEL (The user's key requirement) */}
          <div className="moderation-authority-card">
            <div className="moderation-authority-header">
              <div className="authority-title">
                <ShieldCheck size={22} color="var(--aust-green)" />
                <span>Course Teacher Final Moderation Authority</span>
              </div>
              <span className="instructor-badge">
                {currentStudent.sectionTeacher} ({currentStudent.sectionName})
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--aust-slate-700)', marginBottom: '12px' }}>
              {isSectionInstructor ? (
                <span>
                  You are the <strong>Course Teacher for {currentStudent.sectionName}</strong>. If this student lost marks because the question setter or peer marker did not recognize a notation or method taught in your classroom lectures, you have the department authority to adjust marks here with a recorded reason.
                </span>
              ) : (
                <span>
                  Viewing {currentStudent.sectionName} script. (Course-In-Charge: <strong>{currentStudent.sectionTeacher}</strong>).
                </span>
              )}
            </p>

            {/* Quick Adjustment Actions */}
            <div className="adjustment-controls">
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--aust-slate-800)' }}>
                Class Context Adjustment:
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

        {/* Right Column: Dispute-Proof Student Feedback Card (Script Viewing Day) */}
        <div>
          <div className="student-inspection-card">
            <div className="inspection-card-header">
              <div>
                <span className="brand-badge" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  AUST CSE Midterm Feedback Card
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aust-slate-900)' }}>
                  {currentStudent.studentName}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--aust-slate-500)' }}>
                  Student ID: {currentStudent.studentId} • {currentStudent.sectionName}
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
                  Final Awarded Marks
                </div>
              </div>
            </div>

            {/* Step-by-Step Breakdown Table */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--aust-slate-800)', marginBottom: '8px' }}>
              Rubric Itemization & Partial Mark Accounting
            </h4>

            <table className="score-breakdown-table">
              <thead>
                <tr>
                  <th>Criterion</th>
                  <th>Awarded</th>
                  <th>Faculty Explanation</th>
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

                {/* Course Teacher Adjustment Row */}
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

            {/* Constructive Explanation for Student */}
            <div style={{
              background: 'var(--aust-slate-50)',
              border: '1px solid var(--aust-slate-200)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--aust-slate-500)', marginBottom: '4px' }}>
                Script Inspection Day Student Note:
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--aust-slate-800)', lineHeight: '1.5' }}>
                "{currentStudent.feedbackNote}"
              </p>
            </div>

            {/* Sign-off & Audit Log */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="audit-tag">
                  ✓ Verified by {currentStudent.sectionTeacher} ({currentStudent.status})
                </span>
              </div>

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
    </div>
  );
}
