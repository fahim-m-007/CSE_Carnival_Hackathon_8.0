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
  Lock,
  PlusCircle,
  RefreshCw,
  X,
  Play,
  Code
} from 'lucide-react';
import { assessScriptWithAI } from '../services/aiAssessmentService';
import { isCourseInCharge } from '../services/courseService';
import { updateScriptOnBackend, createScriptOnBackend } from '../services/scriptService';

export function ResultAssessment({
  studentScripts = [],
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
  const sectionScripts = (studentScripts || []).filter(s => s.section === selectedSection);
  const visibleScripts = sectionScripts.length > 0 ? sectionScripts : (studentScripts || []);

  const [selectedStudentId, setSelectedStudentId] = useState(
    visibleScripts[0]?.id || studentScripts[0]?.id || null
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isBatchEvaluating, setIsBatchEvaluating] = useState(false);

  // Modal State for adding custom student script
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newScriptCode, setNewScriptCode] = useState('');
  const [isSubmittingNewScript, setIsSubmittingNewScript] = useState(false);

  // Active student guaranteed to belong to visible section if possible
  const currentStudent = visibleScripts.find(s => s.id === selectedStudentId) || visibleScripts[0] || null;
  const currentSectionObj = (course.sections || []).find(s => s.id === selectedSection) || course.sections?.[0] || { id: 'sec_a', name: 'Section A' };

  // STRICT RBAC: User can moderate ONLY if assigned to this section OR is Course In-Charge
  const currentSectionTeacherName = currentSectionObj?.teacherName || currentSectionObj?.instructor;
  const isAssignedToThisSection = Boolean(
    currentSectionObj?.teacherId === currentUser?.id ||
    currentSectionTeacherName?.toLowerCase() === currentUser?.name?.toLowerCase() ||
    (currentStudent && (
      currentStudent.sectionTeacher?.toLowerCase() === currentUser?.name?.toLowerCase() ||
      currentStudent.teacherId === currentUser?.id
    ))
  );
  const isCoordinator = isCourseInCharge(course, currentUser);
  const canModerate = isAssignedToThisSection || isCoordinator;

  // AI Evaluation against the Locked Rubric for a single script
  const handleRunAiEvaluation = async () => {
    if (!currentStudent) return;
    setIsEvaluating(true);
    try {
      const evalResult = await assessScriptWithAI({
        scriptCode: currentStudent.submittedCode,
        rubric: rubricCriteria,
        penalties: penalties,
        sectionNotes: question.sectionSpecificAllowances?.[currentStudent.section] || '',
        courseInCharge: currentUser?.name || 'Faculty Member'
      });

      if (evalResult) {
        const base = evalResult.totalAwarded;
        const finalMarks = Number((base + (currentStudent.courseTeacherAdjustment || 0)).toFixed(1));
        const updatePayload = {
          baseAiScore: base,
          breakdown: evalResult.breakdown,
          feedbackNote: evalResult.feedbackNote,
          evaluatorNotes: evalResult.evaluatorNotes || 'Automated Rubric Evaluation completed.',
          modelUsed: evalResult.modelUsed || (evalResult.isLiveGemini ? 'gemini-2.5-flash' : 'academic-synthesizer'),
          isLiveGemini: Boolean(evalResult.isLiveGemini),
          finalMarks,
          status: 'APPROVED'
        };

        // Persist to MongoDB backend
        await updateScriptOnBackend(currentStudent.id, updatePayload);

        setStudentScripts(prev =>
          prev.map(s => {
            if (s.id === currentStudent.id) {
              return {
                ...s,
                ...updatePayload
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

  // Batch AI Evaluation for all visible scripts in this section
  const handleBatchEvaluateAll = async () => {
    if (!visibleScripts || visibleScripts.length === 0) return;
    setIsBatchEvaluating(true);
    try {
      const updatedMap = {};
      for (const script of visibleScripts) {
        const evalResult = await assessScriptWithAI({
          scriptCode: script.submittedCode,
          rubric: rubricCriteria,
          penalties: penalties,
          sectionNotes: question.sectionSpecificAllowances?.[script.section] || '',
          courseInCharge: currentUser?.name || 'Faculty Member'
        });

        if (evalResult) {
          const base = evalResult.totalAwarded;
          const finalMarks = Number((base + (script.courseTeacherAdjustment || 0)).toFixed(1));
          const updatePayload = {
            baseAiScore: base,
            breakdown: evalResult.breakdown,
            feedbackNote: evalResult.feedbackNote,
            evaluatorNotes: evalResult.evaluatorNotes || 'Automated Rubric Evaluation completed.',
            modelUsed: evalResult.modelUsed || (evalResult.isLiveGemini ? 'gemini-2.5-flash' : 'academic-synthesizer'),
            isLiveGemini: Boolean(evalResult.isLiveGemini),
            finalMarks,
            status: 'APPROVED'
          };
          await updateScriptOnBackend(script.id, updatePayload);
          updatedMap[script.id] = updatePayload;
        }
      }

      setStudentScripts(prev =>
        prev.map(s => {
          if (updatedMap[s.id]) {
            return { ...s, ...updatedMap[s.id] };
          }
          return s;
        })
      );
    } catch (err) {
      console.error("Batch AI evaluation failed:", err);
    } finally {
      setIsBatchEvaluating(false);
    }
  };

  // Auto-generate 3 sample student scripts for empty sections
  const handleGenerateSampleScripts = async () => {
    const secId = selectedSection || course.sections?.[0]?.id || 'sec_a';
    const secObj = (course.sections || []).find(s => s.id === secId) || course.sections?.[0] || { id: 'sec_a', name: 'Section A' };
    const secName = secObj.name || 'Section A';
    const teacherName = secObj.teacherName || currentUser?.name || 'Faculty Member';

    const samples = [
      {
        id: `scr_${Date.now()}_1`,
        courseId: course.id,
        studentId: `20210104${Math.floor(10 + Math.random() * 89)}`,
        studentName: "Tahmid Hossain",
        section: secId,
        sectionName: secName,
        sectionTeacher: teacherName,
        teacherId: secObj.teacherId || currentUser?.id,
        submittedCode: `// Optimal Standard Solution\nNode* reverseList(Node* head) {\n    if (head == nullptr || head->next == nullptr) {\n        return head;\n    }\n    Node* prev = nullptr;\n    Node* curr = head;\n    while (curr != nullptr) {\n        Node* nextNode = curr->next;\n        curr->next = prev;\n        prev = curr;\n        curr = nextNode;\n    }\n    return prev;\n}`,
        baseAiScore: 0,
        maxMarks: question.totalMarks || 5.0,
        status: "SUBMITTED",
        evaluatorNotes: "Awaiting AI evaluation",
        breakdown: [],
        courseTeacherAdjustment: 0,
        adjustmentReason: "",
        finalMarks: 0,
        feedbackNote: "Ready for AI rubric evaluation."
      },
      {
        id: `scr_${Date.now()}_2`,
        courseId: course.id,
        studentId: `20210104${Math.floor(10 + Math.random() * 89)}`,
        studentName: "Sumaiya Akhter",
        section: secId,
        sectionName: secName,
        sectionTeacher: teacherName,
        teacherId: secObj.teacherId || currentUser?.id,
        submittedCode: `// Missing empty list check\nNode* reverseList(Node* head) {\n    Node* prev = NULL;\n    Node* curr = head;\n    while (curr != NULL) {\n        Node* n = curr->next;\n        curr->next = prev;\n        prev = curr;\n        curr = n;\n    }\n    return prev;\n}`,
        baseAiScore: 0,
        maxMarks: question.totalMarks || 5.0,
        status: "SUBMITTED",
        evaluatorNotes: "Awaiting AI evaluation",
        breakdown: [],
        courseTeacherAdjustment: 0,
        adjustmentReason: "",
        finalMarks: 0,
        feedbackNote: "Ready for AI rubric evaluation."
      },
      {
        id: `scr_${Date.now()}_3`,
        courseId: course.id,
        studentId: `20210104${Math.floor(10 + Math.random() * 89)}`,
        studentName: "Fahim Shahriar",
        section: secId,
        sectionName: secName,
        sectionTeacher: teacherName,
        teacherId: secObj.teacherId || currentUser?.id,
        submittedCode: `// Suboptimal space approach\nNode* reverseList(Node* head) {\n    std::vector<int> vals;\n    Node* temp = head;\n    while (temp) { vals.push_back(temp->data); temp = temp->next; }\n    temp = head;\n    for (int i = (int)vals.size() - 1; i >= 0; i--) {\n        temp->data = vals[i];\n        temp = temp->next;\n    }\n    return head;\n}`,
        baseAiScore: 0,
        maxMarks: question.totalMarks || 5.0,
        status: "SUBMITTED",
        evaluatorNotes: "Awaiting AI evaluation",
        breakdown: [],
        courseTeacherAdjustment: 0,
        adjustmentReason: "",
        finalMarks: 0,
        feedbackNote: "Ready for AI rubric evaluation."
      }
    ];

    for (const sample of samples) {
      await createScriptOnBackend(sample);
    }

    setStudentScripts(prev => [...prev, ...samples]);
    setSelectedStudentId(samples[0].id);
  };

  // Submit newly pasted student script and immediately evaluate with AI
  const handleAddNewScript = async (e) => {
    e.preventDefault();
    if (!newStudentId || !newScriptCode) return;

    setIsSubmittingNewScript(true);
    try {
      const secId = selectedSection || course.sections?.[0]?.id || 'sec_a';
      const secObj = (course.sections || []).find(s => s.id === secId) || course.sections?.[0] || { id: 'sec_a', name: 'Section A' };

      const scriptPayload = {
        id: `scr_${Date.now()}`,
        courseId: course.id,
        studentId: newStudentId.trim(),
        studentName: newStudentName.trim() || `Student ${newStudentId.trim()}`,
        section: secId,
        sectionName: secObj.name || 'Section A',
        sectionTeacher: secObj.teacherName || currentUser?.name || 'Faculty Member',
        teacherId: secObj.teacherId || currentUser?.id,
        submittedCode: newScriptCode,
        baseAiScore: 0,
        maxMarks: question.totalMarks || 5.0,
        status: 'SUBMITTED',
        evaluatorNotes: '',
        breakdown: [],
        courseTeacherAdjustment: 0,
        adjustmentReason: '',
        finalMarks: 0,
        feedbackNote: ''
      };

      // Automatically evaluate with AI
      const evalResult = await assessScriptWithAI({
        scriptCode: newScriptCode,
        rubric: rubricCriteria,
        penalties: penalties,
        sectionNotes: question.sectionSpecificAllowances?.[secId] || '',
        courseInCharge: currentUser?.name || 'Faculty Member'
      });

      if (evalResult) {
        scriptPayload.baseAiScore = evalResult.totalAwarded;
        scriptPayload.breakdown = evalResult.breakdown;
        scriptPayload.feedbackNote = evalResult.feedbackNote;
        scriptPayload.evaluatorNotes = evalResult.evaluatorNotes || 'Automated Rubric Evaluation completed.';
        scriptPayload.modelUsed = evalResult.modelUsed || (evalResult.isLiveGemini ? 'gemini-2.5-flash' : 'academic-synthesizer');
        scriptPayload.isLiveGemini = Boolean(evalResult.isLiveGemini);
        scriptPayload.finalMarks = evalResult.totalAwarded;
        scriptPayload.status = 'APPROVED';
      }

      await createScriptOnBackend(scriptPayload);

      setStudentScripts(prev => [scriptPayload, ...prev]);
      setSelectedStudentId(scriptPayload.id);
      setIsAddModalOpen(false);
      setNewStudentName('');
      setNewStudentId('');
      setNewScriptCode('');
    } catch (err) {
      console.error("Failed to add script:", err);
    } finally {
      setIsSubmittingNewScript(false);
    }
  };

  // Course Teacher applies Class Context Adjustment
  const handleApplyAdjustment = (deltaMarks, reasonText) => {
    if (!currentStudent) return;
    const marksToAdd = parseFloat(deltaMarks) || 0;
    const newFinal = Math.min(currentStudent.maxMarks, Math.max(0, currentStudent.baseAiScore + marksToAdd));
    const updatePayload = {
      courseTeacherAdjustment: marksToAdd,
      adjustmentReason: reasonText || "Class Context Allowance granted by Course Teacher.",
      finalMarks: Number(newFinal.toFixed(1)),
      status: "APPROVED"
    };

    // Persist to MongoDB backend
    updateScriptOnBackend(currentStudent.id, updatePayload);

    setStudentScripts(prev =>
      prev.map(s => {
        if (s.id === currentStudent.id) {
          return {
            ...s,
            ...updatePayload
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

      {/* Action Bar for Section: Batch AI Evaluate & Add Script */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '14px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
            style={{ fontSize: '0.82rem', padding: '7px 14px' }}
          >
            <PlusCircle size={16} />
            <span>+ Add / Paste Student Script</span>
          </button>

          {visibleScripts.length > 0 && (
            <button
              type="button"
              onClick={handleBatchEvaluateAll}
              disabled={isBatchEvaluating}
              className="btn-secondary"
              style={{
                fontSize: '0.82rem',
                padding: '7px 14px',
                borderColor: 'var(--aust-green)',
                color: 'var(--aust-green-dark)',
                background: 'var(--aust-green-light)'
              }}
            >
              <Sparkles size={16} />
              <span>{isBatchEvaluating ? 'Batch AI Evaluating...' : `⚡ Batch AI Assess Section (${visibleScripts.length})`}</span>
            </button>
          )}

          {visibleScripts.length === 0 && (
            <button
              type="button"
              onClick={handleGenerateSampleScripts}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '7px 14px' }}
            >
              <Sparkles size={16} />
              <span>✨ Generate 3 Demo Scripts for this Section</span>
            </button>
          )}

        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--aust-slate-500)' }}>
          {visibleScripts.length} script{visibleScripts.length === 1 ? '' : 's'} in {currentSectionObj.name}
        </div>
      </div>

      {/* Empty State Guard: If no scripts in section */}
      {(!currentStudent || visibleScripts.length === 0) ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', margin: '20px 0' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--aust-green-light)', borderRadius: '50%', marginBottom: '16px' }}>
            <FileText size={36} color="var(--aust-green)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aust-slate-900)', marginBottom: '8px' }}>
            No Student Scripts in {currentSectionObj.name} Yet
          </h3>
          <p style={{ maxWidth: '560px', margin: '0 auto 20px', color: 'var(--aust-slate-600)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            There are currently no student exam answer scripts submitted or loaded for <strong>{currentSectionObj.name}</strong>.
            You can paste student code right here, or generate 3 realistic sample scripts to demonstrate AI rubric evaluation and teacher moderation.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleGenerateSampleScripts}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              <Sparkles size={18} />
              <span>✨ Generate 3 Demo Submissions for this Section</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn-secondary"
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              <PlusCircle size={18} />
              <span>+ Paste Student Code to Assess</span>
            </button>
          </div>
        </div>
      ) : (
        <>
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

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    onClick={handleRunAiEvaluation}
                    className="btn-primary"
                    disabled={isEvaluating}
                  >
                    <Sparkles size={16} />
                    <span>
                      {isEvaluating
                        ? 'AI Assessing with Locked Rubric...'
                        : (isGeminiActive ? 'Run Gemini 2.5 Flash Assessment' : 'Run AI Rubric Assessment')}
                    </span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '999px',
                      background: currentStudent.isLiveGemini ? '#dcfce7' : 'var(--aust-slate-100)',
                      color: currentStudent.isLiveGemini ? '#15803d' : 'var(--aust-slate-600)',
                      border: `1px solid ${currentStudent.isLiveGemini ? '#86efac' : 'var(--aust-slate-200)'}`
                    }}>
                      <Sparkles size={12} color={currentStudent.isLiveGemini ? '#15803d' : '#94a3b8'} />
                      <span>{currentStudent.isLiveGemini ? `Google Gemini (${currentStudent.modelUsed || 'gemini-2.5-flash'})` : 'Academic Rubric Evaluator'}</span>
                    </span>
                  </div>
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
                  {isAssignedToThisSection ? (
                    <span>
                      You are the <strong>Assigned Course Teacher for {currentStudent.sectionName}</strong>. If this student lost marks because the question setter did not recognize a notation or method taught in your classroom lectures, you have the department authority to adjust marks here with a recorded reason.
                    </span>
                  ) : isCoordinator ? (
                    <span>
                      You are the <strong>Course In-Charge / Coordinator</strong>. You have overarching authority to calibrate and harmonize marks across all sections.
                    </span>
                  ) : (
                    <span>
                      Viewing {currentStudent.sectionName} script. (Assigned Instructor: <strong>{currentStudent.sectionTeacher}</strong>).
                    </span>
                  )}
                </p>

                {!canModerate && (
                  <div style={{
                    background: '#f8fafc',
                    border: '1.5px dashed var(--aust-slate-300)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    marginBottom: '14px',
                    fontSize: '0.82rem',
                    color: 'var(--aust-slate-600)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <Lock size={18} color="var(--aust-slate-400)" style={{ flexShrink: 0 }} />
                    <div>
                      <strong>View-Only Observation Mode:</strong> You are viewing {currentStudent.sectionName} taught by <strong>{currentStudent.sectionTeacher}</strong>. Mark adjustments and official sign-offs are restricted to the assigned course teacher.
                    </div>
                  </div>
                )}

                <div className="adjustment-controls">
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--aust-slate-800)' }}>
                    Class Context Allowance:
                  </span>

                  <div className="adjustment-btn-group">
                    <button
                      type="button"
                      disabled={!canModerate}
                      onClick={() => handleApplyAdjustment(0, "")}
                      className={`adjust-btn ${currentStudent.courseTeacherAdjustment === 0 ? 'active' : ''}`}
                      style={{ opacity: canModerate ? 1 : 0.45, cursor: canModerate ? 'pointer' : 'not-allowed' }}
                    >
                      0.0 (Standard)
                    </button>
                    <button
                      type="button"
                      disabled={!canModerate}
                      onClick={() => handleApplyAdjustment(0.5, "Class Context: Covered boundary tolerance in lecture.")}
                      className={`adjust-btn ${currentStudent.courseTeacherAdjustment === 0.5 ? 'active' : ''}`}
                      style={{ opacity: canModerate ? 1 : 0.45, cursor: canModerate ? 'pointer' : 'not-allowed' }}
                    >
                      +0.5 Mark
                    </button>
                    <button
                      type="button"
                      disabled={!canModerate}
                      onClick={() => handleApplyAdjustment(1.0, "Class Context: Accepted alternative notation per Week 4 lecture.")}
                      className={`adjust-btn ${currentStudent.courseTeacherAdjustment === 1.0 ? 'active' : ''}`}
                      style={{ opacity: canModerate ? 1 : 0.45, cursor: canModerate ? 'pointer' : 'not-allowed' }}
                    >
                      +1.0 Mark
                    </button>
                    <button
                      type="button"
                      disabled={!canModerate}
                      onClick={() => handleApplyAdjustment(1.5, `Class Context: Alternative algorithm approved by ${currentStudent.sectionTeacher} in lecture.`)}
                      className={`adjust-btn ${currentStudent.courseTeacherAdjustment === 1.5 ? 'active' : ''}`}
                      style={{ opacity: canModerate ? 1 : 0.45, cursor: canModerate ? 'pointer' : 'not-allowed' }}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span className="brand-badge">
                        AUST CSE Assessment Slip
                      </span>
                      {currentStudent.isLiveGemini && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0'
                        }}>
                          <Sparkles size={11} />
                          <span>Gemini Evaluated</span>
                        </span>
                      )}
                    </div>
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
                    {(currentStudent.breakdown || []).map((item, idx) => (
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
                    "{currentStudent.feedbackNote || 'Assessment pending. Click Run AI Rubric Assessment to evaluate.'}"
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
        </>
      )}

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

      {/* Modal: Add Student Script to Assess with AI */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--aust-white)',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '640px',
            width: '100%',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            border: '1px solid var(--aust-slate-200)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--aust-slate-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--aust-slate-50)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={20} color="var(--aust-green)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--aust-slate-900)' }}>
                  Add Student Script to AI Assessment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--aust-slate-400)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddNewScript} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--aust-slate-700)', marginBottom: '4px' }}>
                    Student ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20210104099"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--aust-slate-300)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--aust-slate-700)', marginBottom: '4px' }}>
                    Student Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fahim Shahriar"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--aust-slate-300)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--aust-slate-700)' }}>
                    Student Code Submission *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStudentId('20210104' + Math.floor(10 + Math.random() * 89));
                      setNewStudentName('Kazi Fahim');
                      setNewScriptCode(`// Submitted by student for: ${question?.title || 'Exam Question'}\nNode* reverseList(Node* head) {\n    if (head == nullptr || head->next == nullptr) return head;\n    Node* prev = nullptr;\n    Node* curr = head;\n    while (curr != nullptr) {\n        Node* nextNode = curr->next;\n        curr->next = prev;\n        prev = curr;\n        curr = nextNode;\n    }\n    return prev;\n}`);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.78rem',
                      color: 'var(--aust-green)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ✨ Fill Example Code
                  </button>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder="// Paste student C++, Java, or Python source code here..."
                  value={newScriptCode}
                  onChange={(e) => setNewScriptCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--aust-slate-300)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    background: '#0f172a',
                    color: '#e2e8f0'
                  }}
                />
              </div>

              <div style={{
                background: 'var(--aust-green-light)',
                border: '1px solid var(--aust-green-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '0.8rem',
                color: 'var(--aust-green-dark)'
              }}>
                ℹ️ This script will be automatically submitted to <strong>{currentSectionObj.name}</strong> and immediately evaluated against the <strong>Locked Rubric Standard</strong> with itemized mark accounting.
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                  disabled={isSubmittingNewScript}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmittingNewScript}
                >
                  <Sparkles size={16} />
                  <span>{isSubmittingNewScript ? 'AI Grading Script...' : 'Submit & Assess with AI'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
