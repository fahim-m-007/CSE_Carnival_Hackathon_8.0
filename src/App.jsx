import React, { useState } from 'react';
import './App.css';
import {
  INITIAL_FACULTY_USERS,
  INITIAL_COURSES,
  DEFAULT_QUESTION,
  INITIAL_RUBRIC_CRITERIA,
  INITIAL_PENALTIES,
  INITIAL_STUDENT_SCRIPTS
} from './data/mockData';
import { Auth } from './components/Auth';
import { Header } from './components/Header';
import { TeacherDashboard } from './components/TeacherDashboard';
import { CreateCourseModal } from './components/CreateCourseModal';
import { RubricStudio } from './components/RubricStudio';
import { ResultAssessment } from './components/ResultAssessment';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import {
  FileText,
  CheckSquare,
  BarChart3,
  Layers
} from 'lucide-react';
import { isUserAssignedToCourse, getAssignedSectionsForTeacher } from './services/courseService';

function App() {
  // Authentication State (Starts at null to show Signup/Login screen first)
  const [currentUser, setCurrentUser] = useState(null);

  // Courses & Active Course Selection
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [activeCourse, setActiveCourse] = useState(null);
  const [selectedSection, setSelectedSection] = useState('sec_a');

  // Modal State
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);

  // Active Tab inside Course View: 'rubric' | 'assessment' | 'analytics'
  const [activeCourseTab, setActiveCourseTab] = useState('rubric');

  // Exam Question & Rubric State (Scoped to current course)
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [rubricCriteria, setRubricCriteria] = useState(INITIAL_RUBRIC_CRITERIA);
  const [penalties, setPenalties] = useState(INITIAL_PENALTIES);
  const [isRubricLocked, setIsRubricLocked] = useState(true);

  // Student Scripts & Grading State
  const [studentScripts, setStudentScripts] = useState(INITIAL_STUDENT_SCRIPTS);

  // Auth Handlers
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveCourse(null);
  };

  // Course Handlers with Strict Access Control
  const handleSelectCourse = (course) => {
    // Security check: Only allow access if user is assigned to this course
    if (!isUserAssignedToCourse(course, currentUser)) {
      alert(`Access Restricted: You (${currentUser.name}) are not assigned to teach or coordinate ${course.code}: ${course.title}.`);
      return;
    }

    setActiveCourse(course);
    
    // Automatically select the section that THIS teacher is assigned to
    const mySections = getAssignedSectionsForTeacher(course, currentUser);
    const initialSec = mySections.length > 0 ? mySections[0].id : (course.sections?.[0]?.id || 'sec_a');
    setSelectedSection(initialSec);
    setActiveCourseTab('rubric');

    // Load question, rubric, penalties, and student scripts from selected course JSON
    if (course.question) setQuestion(course.question);
    if (course.rubricCriteria) setRubricCriteria(course.rubricCriteria);
    if (course.penalties) setPenalties(course.penalties);

    // Aggregate all preloaded student scripts from each section of this course
    const allCourseScripts = (course.sections || []).flatMap(sec =>
      (sec.studentScripts || []).map(scr => ({
        ...scr,
        section: scr.section || sec.id,
        sectionName: scr.sectionName || sec.name,
        sectionTeacher: scr.sectionTeacher || sec.teacherName
      }))
    );
    setStudentScripts(allCourseScripts);
  };

  const handleBackToDashboard = () => {
    setActiveCourse(null);
  };

  const handleCourseCreated = (newCourse) => {
    setCourses([newCourse, ...courses]);
    setActiveCourse(newCourse);
    setSelectedSection(newCourse.sections[0]?.id || 'sec_a');
  };

  // If user is not logged in, render the Signup / Login Screen first
  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // Pending count for moderation
  const pendingModerationCount = studentScripts.filter(s => s.status !== 'APPROVED').length;

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        currentUser={currentUser}
        activeCourse={activeCourse}
        onBackToDashboard={handleBackToDashboard}
        onLogout={handleLogout}
        selectedSection={selectedSection}
        onSelectSection={setSelectedSection}
      />

      {/* View: Dashboard or Course Assessment Studio */}
      {!activeCourse ? (
        <main className="main-wrapper">
          <TeacherDashboard
            currentUser={currentUser}
            courses={courses}
            onSelectCourse={handleSelectCourse}
            onOpenCreateModal={() => setIsCreateCourseModalOpen(true)}
          />
        </main>
      ) : (
        <>
          {/* Sub-Navbar for Course View */}
          <nav className="nav-tabs-bar">
            <div className="nav-tabs-inner">
              <button
                onClick={() => setActiveCourseTab('rubric')}
                className={`nav-tab-btn ${activeCourseTab === 'rubric' ? 'active' : ''}`}
              >
                <FileText size={18} />
                <span>1. Rubric Studio (OBE Matrix)</span>
                <span className="tab-badge">
                  {isRubricLocked ? '🔒 Locked Standard' : '✏️ Draft'}
                </span>
              </button>

              <button
                onClick={() => setActiveCourseTab('assessment')}
                className={`nav-tab-btn ${activeCourseTab === 'assessment' ? 'active' : ''}`}
              >
                <CheckSquare size={18} />
                <span>2. AI Result Assessment</span>
                {pendingModerationCount > 0 ? (
                  <span className="tab-badge red-alert">{pendingModerationCount} Pending</span>
                ) : (
                  <span className="tab-badge">✓ Complete</span>
                )}
              </button>

              <button
                onClick={() => setActiveCourseTab('analytics')}
                className={`nav-tab-btn ${activeCourseTab === 'analytics' ? 'active' : ''}`}
              >
                <BarChart3 size={18} />
                <span>3. Cross-Section Analytics</span>
                <span className="tab-badge">Section Fairness</span>
              </button>
            </div>
          </nav>

          {/* Main Course Studio View */}
          <main className="main-wrapper">
            {activeCourseTab === 'rubric' && (
              <RubricStudio
                question={question}
                setQuestion={setQuestion}
                rubricCriteria={rubricCriteria}
                setRubricCriteria={setRubricCriteria}
                penalties={penalties}
                setPenalties={setPenalties}
                selectedSection={selectedSection}
                onSelectSection={setSelectedSection}
                courseData={activeCourse}
                currentUser={currentUser}
                isLocked={isRubricLocked}
                setIsLocked={setIsRubricLocked}
                onProceedToAssessment={() => setActiveCourseTab('assessment')}
              />
            )}

            {activeCourseTab === 'assessment' && (
              <ResultAssessment
                studentScripts={studentScripts}
                setStudentScripts={setStudentScripts}
                course={activeCourse}
                selectedSection={selectedSection}
                onSelectSection={setSelectedSection}
                rubricCriteria={rubricCriteria}
                penalties={penalties}
                question={question}
                currentUser={currentUser}
                isRubricLocked={isRubricLocked}
              />
            )}

            {activeCourseTab === 'analytics' && (
              <AnalyticsDashboard
                studentScripts={studentScripts}
                courseData={activeCourse}
              />
            )}
          </main>
        </>
      )}

      {/* Footer */}
      <footer style={{
        background: 'var(--aust-white)',
        borderTop: '1px solid var(--aust-slate-200)',
        padding: '16px 24px',
        fontSize: '0.8rem',
        color: 'var(--aust-slate-500)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong>GradeCalibrate</strong> — Built for <strong>AUST CSE Carnival &lt;8.0/&gt; AI Build Hackathon Final Round</strong>
          </div>
          <div>
            Ahsanullah University of Science and Technology • Outcome-Based Education (OBE) & BAETE Standard Compliant
          </div>
        </div>
      </footer>

      {/* Create Course & Invite Co-Teachers Modal */}
      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        onClose={() => setIsCreateCourseModalOpen(false)}
        currentUser={currentUser}
        onCourseCreated={handleCourseCreated}
      />
    </div>
  );
}

export default App;
