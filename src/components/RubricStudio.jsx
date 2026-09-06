import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Lock,
  Unlock,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  BookOpen,
  Info,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import { generateRubricWithAI } from '../services/aiAssessmentService';

export function RubricStudio({
  question,
  setQuestion,
  rubricCriteria,
  setRubricCriteria,
  penalties,
  setPenalties,
  selectedSection,
  onSelectSection,
  courseData,
  currentUser,
  isLocked,
  setIsLocked,
  onProceedToAssessment
}) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Custom Penalty Creation State
  const [isAddingPenalty, setIsAddingPenalty] = useState(false);
  const [customPenaltyTitle, setCustomPenaltyTitle] = useState('');
  const [customDeduction, setCustomDeduction] = useState(1.0);
  const [customPenaltyDescription, setCustomPenaltyDescription] = useState('');

  const currentSection = courseData.sections.find(s => s.id === selectedSection) || courseData.sections[0];
  const sectionAllowance = question.sectionSpecificAllowances?.[selectedSection] || '';

  const handleAllowanceChange = (val) => {
    setQuestion(prev => ({
      ...prev,
      sectionSpecificAllowances: {
        ...prev.sectionSpecificAllowances,
        [selectedSection]: val
      }
    }));
  };

  const handleCriterionWeightChange = (id, newWeight) => {
    const val = parseFloat(newWeight) || 0;
    setRubricCriteria(prev =>
      prev.map(c => c.id === id ? { ...c, weight: val, maxMarks: val } : c)
    );
  };

  const handleOpenAddPenalty = () => {
    setIsAddingPenalty(true);
  };

  const handleSavePenalty = (e) => {
    if (e) e.preventDefault();
    if (!customPenaltyTitle.trim()) return;
    const deductionVal = Math.max(0.1, parseFloat(customDeduction) || 1.0);
    const newPen = {
      id: `pen_${Date.now()}`,
      title: customPenaltyTitle.trim(),
      deduction: Number(deductionVal.toFixed(1)),
      description: customPenaltyDescription.trim() || `Deduction of ${deductionVal.toFixed(1)} mark(s) for ${customPenaltyTitle.trim()}.`
    };
    setPenalties(prev => [...prev, newPen]);
    setCustomPenaltyTitle('');
    setCustomDeduction(1.0);
    setCustomPenaltyDescription('');
    setIsAddingPenalty(false);
  };

  const handlePenaltyDeductionChange = (id, newDeduction) => {
    const val = Math.max(0.1, parseFloat(newDeduction) || 0.1);
    setPenalties(prev =>
      prev.map(p => p.id === id ? { ...p, deduction: Number(val.toFixed(1)) } : p)
    );
  };

  const handleRemovePenalty = (id) => {
    setPenalties(prev => prev.filter(p => p.id !== id));
  };

  const handleAIGenerate = async () => {
    setLoading(true);
    setSuccessMessage('');
    try {
      const generated = await generateRubricWithAI({
        questionPrompt: question.prompt,
        totalMarks: question.totalMarks,
        solutionNotes: question.solutionNotes,
        bloomsLevel: question.bloomsLevel,
        sectionContext: sectionAllowance
      });

      if (generated && generated.criteria) {
        setRubricCriteria(generated.criteria);
        if (generated.penalties) setPenalties(generated.penalties);
        setSuccessMessage('AI Rubric synthesized and aligned with OBE & Section Teaching Context!');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalCalculated = rubricCriteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  const isWeightBalanced = Math.abs(totalCalculated - question.totalMarks) < 0.05;

  return (
    <div>
      {/* Intro Banner */}
      <div className="page-intro-banner">
        <div className="page-intro-content">
          <h2>1. Question Setup & Objective Rubric Matrix</h2>
          <p>
            Eliminate subjective "gut feeling" grading. The AI breaks down the exam question into
            verifiable Outcome-Based Education (OBE) criteria, while allowing course teachers to incorporate
            section-specific lecture nuances.
          </p>
        </div>
        <div className="banner-stats">
          <div className="banner-stat-box">
            <span className="banner-stat-num">{question.totalMarks.toFixed(1)}</span>
            <span className="banner-stat-label">Total Marks</span>
          </div>
          <div className="banner-stat-box">
            <span className="banner-stat-num">{rubricCriteria.length}</span>
            <span className="banner-stat-label">Criteria</span>
          </div>
          <div className="banner-stat-box">
            <span className="banner-stat-num">{penalties.length}</span>
            <span className="banner-stat-label">Penalties</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid-2">
        {/* Left Column: Question Details & Section Context */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <FileText size={20} color="var(--aust-green)" />
                <span>Exam Question Metadata</span>
              </div>
              <span className="brand-badge">{question.number}</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--aust-slate-700)', marginBottom: '4px' }}>
                Question Title
              </label>
              <input
                type="text"
                value={question.title}
                onChange={(e) => setQuestion({ ...question, title: e.target.value })}
                className="section-context-input"
                disabled={isLocked}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--aust-slate-700)', marginBottom: '4px' }}>
                Official Question Prompt (As Printed on Paper)
              </label>
              <textarea
                rows={4}
                value={question.prompt}
                onChange={(e) => setQuestion({ ...question, prompt: e.target.value })}
                className="section-context-input"
                disabled={isLocked}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--aust-slate-700)', marginBottom: '4px' }}>
                  Total Question Marks
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={question.totalMarks}
                  onChange={(e) => setQuestion({ ...question, totalMarks: parseFloat(e.target.value) || 0 })}
                  className="section-context-input"
                  disabled={isLocked}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--aust-slate-700)', marginBottom: '4px' }}>
                  Target Bloom's Level
                </label>
                <input
                  type="text"
                  value={question.bloomsLevel}
                  onChange={(e) => setQuestion({ ...question, bloomsLevel: e.target.value })}
                  className="section-context-input"
                  disabled={isLocked}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--aust-slate-700)', marginBottom: '4px' }}>
                Faculty Quick Solution Notes & Intent
              </label>
              <textarea
                rows={3}
                value={question.solutionNotes}
                onChange={(e) => setQuestion({ ...question, solutionNotes: e.target.value })}
                className="section-context-input"
                placeholder="Key expectations (e.g., must use 3 pointers, check head == NULL, penalize O(n) space)..."
                disabled={isLocked}
              />
            </div>

            {/* SECTION TEACHING CONTEXT BOX (User's specific university requirement) */}
            {(() => {
              const teacherName = currentSection.teacherName || currentSection.instructor || 'Faculty Member';
              const isMySection = currentSection.teacherId === currentUser?.id || teacherName.toLowerCase() === currentUser?.name?.toLowerCase();
              const isCoordinator = courseData.creatorId === currentUser?.id || courseData.creatorName?.toLowerCase() === currentUser?.name?.toLowerCase();
              const canEditSectionContext = !isLocked && (isMySection || isCoordinator);

              return (
                <div className="section-context-box">
                  <div className="section-context-header">
                    <span className="section-context-badge">
                      <Layers size={14} />
                      <span>Section Teaching Context: {currentSection.name}</span>
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--aust-green-dark)' }}>
                      Instructor: {teacherName} {isMySection && '• (You)'}
                    </span>
                  </div>
                  <p className="section-context-desc">
                    {isCoordinator
                      ? `As Course In-Charge / Coordinator, you can review or calibrate section-specific allowances across all sections.`
                      : isMySection
                        ? `As the assigned instructor for ${currentSection.name}, specify any alternative notations, algorithms, or syntax taught in your lectures that peer markers must accept.`
                        : `Teaching notes recorded for ${currentSection.name} by ${teacherName}.`}
                  </p>
                  <textarea
                    rows={3}
                    value={sectionAllowance}
                    onChange={(e) => handleAllowanceChange(e.target.value)}
                    className="section-context-input"
                    placeholder="e.g., In Section A, returning 'prev' without mutating 'head' in main is accepted for full credit. 0-based indexing taught."
                    disabled={!canEditSectionContext}
                    style={{
                      background: canEditSectionContext ? 'var(--aust-white)' : 'var(--aust-slate-100)',
                      cursor: canEditSectionContext ? 'text' : 'not-allowed'
                    }}
                  />
                  {!canEditSectionContext && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--aust-slate-500)', marginTop: '6px' }}>
                      🔒 Read-Only: Only the assigned instructor ({teacherName}) or Course In-Charge can modify this section's teaching context.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Action Bar */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAIGenerate}
                className="btn-primary"
                disabled={loading || isLocked}
                style={{ flex: 1 }}
              >
                <Sparkles size={16} />
                <span>{loading ? 'AI Synthesizing Rubric...' : 'Synthesize / Update Rubric with AI'}</span>
              </button>
            </div>

            {successMessage && (
              <div style={{
                marginTop: '12px',
                padding: '10px',
                background: 'var(--aust-green-light)',
                color: 'var(--aust-green-dark)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Rubric Matrix */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Sliders size={20} color="var(--aust-green)" />
                <span>Locked Standard Marking Matrix</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: isWeightBalanced ? 'var(--aust-green-dark)' : 'var(--aust-red)'
                }}>
                  Sum: {totalCalculated.toFixed(1)} / {question.totalMarks.toFixed(1)} Marks
                </span>

                <button
                  onClick={() => setIsLocked(!isLocked)}
                  className={isLocked ? "btn-primary" : "btn-secondary"}
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  {isLocked ? (
                    <>
                      <Lock size={14} /> Locked Standard
                    </>
                  ) : (
                    <>
                      <Unlock size={14} /> Unlocked (Editing)
                    </>
                  )}
                </button>
              </div>
            </div>

            {!isWeightBalanced && (
              <div style={{
                marginBottom: '14px',
                padding: '8px 12px',
                background: 'var(--aust-red-light)',
                border: '1px solid var(--aust-red-border)',
                color: 'var(--aust-red)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} />
                <span>Criteria weights ({totalCalculated.toFixed(1)}) do not match total marks ({question.totalMarks.toFixed(1)}). Please adjust weights.</span>
              </div>
            )}

            {/* Criteria Cards */}
            <div className="criteria-list">
              {rubricCriteria.map((crit, idx) => (
                <div key={crit.id} className="criterion-card">
                  <div className="criterion-top">
                    <div className="criterion-title-group">
                      <h4>
                        <span style={{ color: 'var(--aust-green)', marginRight: '6px' }}>Step {idx + 1}:</span>
                        {crit.title}
                      </h4>
                      <span className="bloom-pill">Bloom's: {crit.bloomLevel}</span>
                    </div>

                    <div className="weight-controller">
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--aust-green-dark)' }}>Marks:</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max={question.totalMarks}
                        value={crit.weight}
                        onChange={(e) => handleCriterionWeightChange(crit.id, e.target.value)}
                        className="weight-input"
                        disabled={isLocked}
                      />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--aust-slate-600)', marginBottom: '10px' }}>
                    {crit.description}
                  </p>

                  {/* 3-Tier Matrix */}
                  <div className="tiers-grid">
                    <div className="tier-box full">
                      <div className="tier-label">
                        <span>Full Credit</span>
                        <span>{(crit.weight).toFixed(1)} M</span>
                      </div>
                      <div>{crit.fullCredit}</div>
                    </div>

                    <div className="tier-box partial">
                      <div className="tier-label">
                        <span>Partial Credit</span>
                        <span>{(crit.weight / 2).toFixed(1)} M</span>
                      </div>
                      <div>{crit.partialCredit}</div>
                    </div>

                    <div className="tier-box zero">
                      <div className="tier-label">
                        <span>Zero Credit</span>
                        <span>0.0 M</span>
                      </div>
                      <div>{crit.zeroCredit}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Penalty Constraints */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--aust-slate-200)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--aust-slate-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Standard Penalty Constraints (Deductions)
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--aust-slate-500)', background: 'var(--aust-slate-100)', padding: '2px 8px', borderRadius: '12px' }}>
                      {penalties.length} active
                    </span>
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--aust-slate-500)', margin: '2px 0 0 0' }}>
                    Define criteria-specific deductions (e.g. complexity violations, missing guards). Teachers can type custom penalties and select marks deducted.
                  </p>
                </div>

                {!isLocked && !isAddingPenalty && (
                  <button
                    onClick={handleOpenAddPenalty}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', color: 'var(--aust-red)', borderColor: 'var(--aust-red-border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
                  >
                    <Plus size={14} /> Add Custom Penalty Rule
                  </button>
                )}
              </div>

              {/* Add Custom Penalty Panel */}
              {isAddingPenalty && !isLocked && (
                <div style={{
                  background: 'var(--aust-white)',
                  border: '2px solid #fca5a5',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: 'var(--aust-red-light)',
                        color: 'var(--aust-red)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        letterSpacing: '0.5px'
                      }}>
                        NEW PENALTY
                      </span>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--aust-slate-900)' }}>
                        Define Custom Penalty & Select Deduction Marks
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddingPenalty(false)}
                      style={{ color: 'var(--aust-slate-400)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '12px' }}>
                    {/* Penalty Title Input */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--aust-slate-700)', marginBottom: '5px' }}>
                        Custom Penalty Name / Reason *
                      </label>
                      <input
                        type="text"
                        value={customPenaltyTitle}
                        onChange={(e) => setCustomPenaltyTitle(e.target.value)}
                        placeholder="e.g., Space Complexity Violation (> O(1)), Infinite Loop, Missing Edge Case"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1.5px solid var(--aust-slate-300)',
                          outline: 'none'
                        }}
                        autoFocus
                      />
                    </div>

                    {/* Marks Deducted Selector */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--aust-slate-700)', marginBottom: '5px' }}>
                        Select Marks Deducted (-M) *
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setCustomDeduction(val)}
                            style={{
                              padding: '5px 9px',
                              fontSize: '0.78rem',
                              fontWeight: customDeduction === val ? 800 : 600,
                              borderRadius: '4px',
                              border: customDeduction === val ? '1.5px solid var(--aust-red)' : '1px solid var(--aust-slate-300)',
                              background: customDeduction === val ? 'var(--aust-red-light)' : 'var(--aust-white)',
                              color: customDeduction === val ? 'var(--aust-red)' : 'var(--aust-slate-700)',
                              cursor: 'pointer'
                            }}
                          >
                            -{val.toFixed(1)} M
                          </button>
                        ))}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--aust-slate-500)', fontWeight: 600 }}>Custom:</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0.1"
                            max={question.totalMarks || 5.0}
                            value={customDeduction}
                            onChange={(e) => setCustomDeduction(parseFloat(e.target.value) || 0.1)}
                            style={{
                              width: '60px',
                              padding: '4px 6px',
                              fontSize: '0.82rem',
                              borderRadius: '4px',
                              border: '1.5px solid var(--aust-slate-300)',
                              fontWeight: 700,
                              textAlign: 'center'
                            }}
                          />
                          <span style={{ fontSize: '0.78rem', color: 'var(--aust-slate-600)' }}>M</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description input */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--aust-slate-700)', marginBottom: '5px' }}>
                      Penalty Condition / Context Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={customPenaltyDescription}
                      onChange={(e) => setCustomPenaltyDescription(e.target.value)}
                      placeholder="e.g., Applies if student allocates auxiliary buffer instead of in-place pointer reversal."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1.5px solid var(--aust-slate-300)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddingPenalty(false)}
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePenalty}
                      className="btn-primary"
                      disabled={!customPenaltyTitle.trim()}
                      style={{
                        padding: '6px 16px',
                        fontSize: '0.82rem',
                        background: customPenaltyTitle.trim() ? 'var(--aust-red)' : 'var(--aust-slate-300)',
                        borderColor: customPenaltyTitle.trim() ? 'var(--aust-red)' : 'var(--aust-slate-300)',
                        cursor: customPenaltyTitle.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={14} /> Add -{Number(customDeduction).toFixed(1)} Mark Penalty
                    </button>
                  </div>
                </div>
              )}

              {/* Active Penalties List */}
              <div className="penalty-chip-list">
                {penalties.map((pen) => (
                  <div key={pen.id} className="penalty-chip" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {!isLocked ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              background: 'var(--aust-white)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1.5px solid var(--aust-red-border)'
                            }}
                            title="Select or type marks deducted for this penalty"
                          >
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--aust-red)' }}>-</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0.1"
                              max={question.totalMarks || 5.0}
                              value={pen.deduction}
                              onChange={(e) => handlePenaltyDeductionChange(pen.id, e.target.value)}
                              style={{
                                width: '50px',
                                padding: '1px 2px',
                                fontSize: '0.82rem',
                                border: 'none',
                                outline: 'none',
                                fontWeight: 800,
                                color: 'var(--aust-red)',
                                textAlign: 'center',
                                background: 'transparent'
                              }}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--aust-red)' }}>Mark</span>
                          </div>
                        ) : (
                          <span className="penalty-deduction">-{pen.deduction.toFixed(1)} Mark</span>
                        )}
                        <strong style={{ color: 'var(--aust-slate-800)', fontSize: '0.88rem' }}>{pen.title}</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--aust-slate-600)', marginTop: '4px' }}>
                        {pen.description}
                      </div>
                    </div>

                    {!isLocked && (
                      <button
                        onClick={() => handleRemovePenalty(pen.id)}
                        style={{ color: 'var(--aust-red)', marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                        title="Remove penalty constraint"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Lock Standard Action */}
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setIsLocked(!isLocked)}
                className={isLocked ? "btn-secondary" : "btn-primary"}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isLocked ? (
                  <>
                    <Unlock size={16} /> Unlock Rubric to Make Adjustments
                  </>
                ) : (
                  <>
                    <Lock size={16} /> 🔒 Lock & Enforce Standard Rubric Across All Sections
                  </>
                )}
              </button>

              {isLocked && onProceedToAssessment && (
                <button
                  onClick={onProceedToAssessment}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                >
                  <span>Proceed to AI Student Assessment</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
