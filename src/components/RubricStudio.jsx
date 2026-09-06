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
  Layers
} from 'lucide-react';
import { generateRubricWithAI } from '../services/aiAssessmentService';
import { ArrowRight } from 'lucide-react';

export function RubricStudio({
  question,
  setQuestion,
  rubricCriteria,
  setRubricCriteria,
  penalties,
  setPenalties,
  selectedSection,
  courseData,
  isLocked,
  setIsLocked,
  onProceedToAssessment
}) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleAddPenalty = () => {
    const newPen = {
      id: `pen_${Date.now()}`,
      title: "Custom Penalty Constraint",
      deduction: 1.0,
      description: "Deduction for specific code defect or constraint violation."
    };
    setPenalties(prev => [...prev, newPen]);
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
            <div className="section-context-box">
              <div className="section-context-header">
                <span className="section-context-badge">
                  <Layers size={14} />
                  <span>Section Teaching Context: {currentSection.name}</span>
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--aust-green-dark)' }}>
                  Instructor: {currentSection.instructor}
                </span>
              </div>
              <p className="section-context-desc">
                {currentSection.isCourseInCharge
                  ? `As Course-In-Charge for ${currentSection.name}, specify any alternative notations, methods, or syntax taught during your class lectures that peer markers must honor.`
                  : `Question was authored by ${currentSection.instructor}. Notes reflect standard syllabus conventions.`}
              </p>
              <textarea
                rows={3}
                value={sectionAllowance}
                onChange={(e) => handleAllowanceChange(e.target.value)}
                className="section-context-input"
                placeholder="e.g., In Section A, returning 'prev' without mutating 'head' in main is accepted for full credit. 0-based indexing taught."
                disabled={isLocked}
              />
            </div>

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--aust-slate-900)' }}>
                  Standard Penalty Constraints (Deductions)
                </h4>
                {!isLocked && (
                  <button
                    onClick={handleAddPenalty}
                    style={{ fontSize: '0.8rem', color: 'var(--aust-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Add Penalty Rule
                  </button>
                )}
              </div>

              <div className="penalty-chip-list">
                {penalties.map((pen) => (
                  <div key={pen.id} className="penalty-chip">
                    <div>
                      <span className="penalty-deduction">-{pen.deduction.toFixed(1)} Mark</span>
                      <strong style={{ marginLeft: '8px', color: 'var(--aust-slate-800)' }}>{pen.title}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--aust-slate-600)', marginTop: '2px' }}>
                        {pen.description}
                      </div>
                    </div>
                    {!isLocked && (
                      <button
                        onClick={() => handleRemovePenalty(pen.id)}
                        style={{ color: 'var(--aust-red)', marginLeft: '6px' }}
                        title="Remove penalty"
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
