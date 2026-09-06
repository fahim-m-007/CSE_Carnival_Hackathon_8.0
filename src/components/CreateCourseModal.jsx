import React, { useState } from 'react';
import { BookPlus, X, Plus, Trash2, Mail, Users, Check, GraduationCap } from 'lucide-react';

export function CreateCourseModal({ isOpen, onClose, currentUser, onCourseCreated }) {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [batch, setBatch] = useState('Batch 53');
  const [term, setTerm] = useState('Spring 2026');

  // Sections
  const [sections, setSections] = useState([
    { name: 'Section A', enrolled: 50 },
    { name: 'Section B', enrolled: 50 }
  ]);

  // Invitations to other teachers
  const [invitations, setInvitations] = useState([
    {
      inviteeName: '',
      inviteeEmail: '',
      designation: 'Lecturer',
      assignedSection: 'Section B',
      role: 'Section Teacher'
    }
  ]);

  if (!isOpen) return null;

  const handleAddSection = () => {
    const nextChar = String.fromCharCode(65 + sections.length);
    setSections([...sections, { name: `Section ${nextChar}`, enrolled: 50 }]);
  };

  const handleRemoveSection = (index) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleAddInvitation = () => {
    setInvitations([
      ...invitations,
      {
        inviteeName: '',
        inviteeEmail: '',
        designation: 'Lecturer',
        assignedSection: sections[0]?.name || 'Section A',
        role: 'Section Teacher'
      }
    ]);
  };

  const handleRemoveInvitation = (index) => {
    setInvitations(invitations.filter((_, i) => i !== index));
  };

  const handleUpdateInvitation = (index, field, value) => {
    const updated = [...invitations];
    updated[index][field] = value;
    setInvitations(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code || !title) return;

    const newCourse = {
      id: `course_${Date.now()}`,
      code: code.toUpperCase(),
      title,
      batch,
      term,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      sections: sections.map((sec, idx) => {
        // Find if this section has an invited co-teacher
        const invite = invitations.find(inv => inv.assignedSection === sec.name && inv.inviteeName);
        return {
          id: `sec_${Date.now()}_${idx}`,
          name: sec.name,
          enrolled: sec.enrolled,
          teacherId: invite ? `fac_invited_${idx}` : currentUser.id,
          teacherName: invite ? invite.inviteeName : currentUser.name,
          teacherDesignation: invite ? invite.designation : currentUser.designation,
          role: invite ? `${invite.role} (${sec.name})` : "Course In-Charge",
          teachingNotes: "Standard department curriculum syllabus."
        };
      }),
      invitations: invitations.filter(inv => inv.inviteeEmail),
      exams: [
        {
          id: `exam_${Date.now()}`,
          title: "Midterm Examination",
          date: "2026-03-20",
          totalMarks: 20.0,
          questionsCount: 4,
          status: "DRAFT_RUBRIC"
        }
      ]
    };

    onCourseCreated(newCourse);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content course-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookPlus size={22} color="var(--aust-green)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aust-slate-900)' }}>
              Initialize New Course & Section Team
            </h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label className="form-label">Course Code</label>
              <input
                type="text"
                placeholder="CSE 2101"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="section-context-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Course Title</label>
              <input
                type="text"
                placeholder="Data Structures"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="section-context-input"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <div>
              <label className="form-label">Academic Batch</label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="section-context-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Semester / Term</label>
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="section-context-input"
                required
              />
            </div>
          </div>

          {/* Sections Configuration */}
          <div style={{ marginBottom: '18px', background: 'var(--aust-slate-50)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--aust-slate-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--aust-slate-800)' }}>
                Course Sections
              </span>
              <button
                type="button"
                onClick={handleAddSection}
                style={{ fontSize: '0.78rem', color: 'var(--aust-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add Section
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {sections.map((sec, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--aust-white)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--aust-slate-300)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{sec.name}</span>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(i)}
                      style={{ color: 'var(--aust-red)', marginLeft: '4px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Co-Teacher Invitations for Different Sections */}
          <div style={{ marginBottom: '20px', background: 'var(--aust-green-light)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--aust-green-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--aust-green-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} /> Co-Teacher Section Allocations & Invitations
              </span>
              <button
                type="button"
                onClick={handleAddInvitation}
                style={{ fontSize: '0.78rem', color: 'var(--aust-green-dark)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Invite Another Teacher
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--aust-slate-600)', marginBottom: '10px' }}>
              Assign colleague faculty members to conduct specific sections and collaborate on rubrics and moderation.
            </p>

            {invitations.map((inv, idx) => (
              <div key={idx} style={{ background: 'var(--aust-white)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--aust-slate-200)', marginBottom: '8px', display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr auto', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Teacher Name"
                  value={inv.inviteeName}
                  onChange={(e) => handleUpdateInvitation(idx, 'inviteeName', e.target.value)}
                  style={{ padding: '6px 8px', fontSize: '0.82rem', border: '1px solid var(--aust-slate-300)', borderRadius: '4px' }}
                />
                <input
                  type="email"
                  placeholder="faculty@aust.edu"
                  value={inv.inviteeEmail}
                  onChange={(e) => handleUpdateInvitation(idx, 'inviteeEmail', e.target.value)}
                  style={{ padding: '6px 8px', fontSize: '0.82rem', border: '1px solid var(--aust-slate-300)', borderRadius: '4px' }}
                />
                <select
                  value={inv.designation}
                  onChange={(e) => handleUpdateInvitation(idx, 'designation', e.target.value)}
                  style={{ padding: '6px 4px', fontSize: '0.8rem', border: '1px solid var(--aust-slate-300)', borderRadius: '4px' }}
                >
                  <option value="Lecturer">Lecturer</option>
                  <option value="Assistant Professor">Asst. Prof.</option>
                  <option value="Associate Professor">Assoc. Prof.</option>
                  <option value="Professor">Professor</option>
                </select>
                <select
                  value={inv.assignedSection}
                  onChange={(e) => handleUpdateInvitation(idx, 'assignedSection', e.target.value)}
                  style={{ padding: '6px 4px', fontSize: '0.8rem', border: '1px solid var(--aust-slate-300)', borderRadius: '4px' }}
                >
                  {sections.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveInvitation(idx)}
                  style={{ color: 'var(--aust-red)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} /> Initialize Course & Send Invitations
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
