import React, { useState } from 'react';
import { LogIn, UserPlus, Shield, GraduationCap, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { INITIAL_FACULTY_USERS } from '../data/mockData';

export function Auth({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [department, setDepartment] = useState('Department of Computer Science & Engineering');
  const [error, setError] = useState('');

  const designations = [
    'Lecturer',
    'Assistant Professor',
    'Associate Professor',
    'Professor',
    'Adjunct Faculty'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      if (!name || !email || !password) {
        setError('Please fill in all required fields.');
        return;
      }
      const newUser = {
        id: `fac_${Date.now()}`,
        name,
        email,
        password,
        designation,
        department,
        university: 'Ahsanullah University of Science and Technology',
        initials: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      };
      onLoginSuccess(newUser);
    } else {
      if (!email || !password) {
        setError('Please enter your email and password.');
        return;
      }
      const found = INITIAL_FACULTY_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        onLoginSuccess(found);
      } else {
        // Allow login with entered credentials as a fallback
        onLoginSuccess({
          id: `fac_${Date.now()}`,
          name: email.split('@')[0].replace('.', ' '),
          email,
          designation: 'Faculty Member',
          department: 'Department of Computer Science & Engineering',
          university: 'Ahsanullah University of Science and Technology',
          initials: 'FM'
        });
      }
    }
  };

  const handleQuickLogin = (facultyUser) => {
    onLoginSuccess(facultyUser);
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container">
        {/* AUST Header & Emblem */}
        <div className="auth-header">
          <img
            src="/aust-logo.png"
            alt="AUST Official Logo"
            className="auth-logo-img"
          />
          <h2 className="auth-title">
            <span>Grade</span><span style={{ color: 'var(--aust-green)' }}>Calibrate</span>
          </h2>
          <p className="auth-subtitle">
            AUST Department of Computer Science & Engineering • Faculty Assessment Portal
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div className="auth-tab-group">
          <button
            type="button"
            className={`auth-tab-btn ${!isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(false); setError(''); }}
          >
            <LogIn size={16} />
            <span>Faculty Sign In</span>
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(true); setError(''); }}
          >
            <UserPlus size={16} />
            <span>Teacher Registration</span>
          </button>
        </div>

        {error && (
          <div className="auth-error-banner">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <>
              <div className="form-group">
                <label>Teacher Full Name</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    placeholder="e.g., Prof. Tariq Mahmud"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Academic Designation</label>
                <div className="input-with-icon">
                  <GraduationCap size={16} className="input-icon" />
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  >
                    {designations.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Institutional Email</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                placeholder="faculty.cse@aust.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit-btn">
            <span>{isSignUp ? 'Register Faculty Account' : 'Access Teacher Dashboard'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* 1-Click Quick Demo Switcher for Hackathon Judges */}
        <div className="quick-login-section">
          <div className="quick-login-divider">
            <span>OR INSTANT DEMO LOGIN</span>
          </div>

          <div className="quick-login-buttons">
            <button
              type="button"
              onClick={() => handleQuickLogin(INITIAL_FACULTY_USERS[0])}
              className="quick-faculty-card"
            >
              <div className="faculty-avatar tm">TM</div>
              <div className="faculty-meta">
                <strong>Prof. Tariq Mahmud</strong>
                <span>Professor (Course In-Charge: Sec A & C)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin(INITIAL_FACULTY_USERS[1])}
              className="quick-faculty-card"
            >
              <div className="faculty-avatar nj">NJ</div>
              <div className="faculty-meta">
                <strong>Lec. Nusrat Jahan</strong>
                <span>Lecturer (Question Setter: Sec B)</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
