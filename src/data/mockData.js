import { CSE_22_COURSES } from './courses/index.js';

// AUST CSE Faculty & Course Mock Data

export const INITIAL_FACULTY_USERS = [
  {
    id: "fac_01",
    name: "Prof. Tariq Mahmud",
    email: "tariq.cse@aust.edu",
    password: "password123",
    designation: "Professor",
    department: "Department of Computer Science & Engineering",
    university: "Ahsanullah University of Science and Technology",
    initials: "TM"
  },
  {
    id: "fac_02",
    name: "Lec. Nusrat Jahan",
    email: "nusrat.cse@aust.edu",
    password: "password123",
    designation: "Lecturer",
    department: "Department of Computer Science & Engineering",
    university: "Ahsanullah University of Science and Technology",
    initials: "NJ"
  },
  {
    id: "fac_03",
    name: "Dr. Kazi Tanvir Ahmed",
    email: "tanvir.cse@aust.edu",
    password: "password123",
    designation: "Associate Professor",
    department: "Department of Computer Science & Engineering",
    university: "Ahsanullah University of Science and Technology",
    initials: "TA"
  }
];

export const INITIAL_COURSES = CSE_22_COURSES;

export const DEFAULT_QUESTION = CSE_22_COURSES[0].question;

export const INITIAL_RUBRIC_CRITERIA = CSE_22_COURSES[0].rubricCriteria;

export const INITIAL_PENALTIES = CSE_22_COURSES[0].penalties;

export const INITIAL_STUDENT_SCRIPTS = CSE_22_COURSES[0].sections.flatMap(s => s.studentScripts || []);


export const SECTION_ANALYTICS_DATA = {
  beforeCalibration: {
    sectionA: { avg: 13.1, variance: 4.8, count: 54, teacher: "Prof. Tariq (Strict)" },
    sectionB: { avg: 18.2, variance: 2.1, count: 52, teacher: "Lec. Nusrat (Lenient)" },
    sectionC: { avg: 13.6, variance: 4.5, count: 54, teacher: "Prof. Tariq (Strict)" },
    discrepancyGap: 5.1
  },
  afterCalibration: {
    sectionA: { avg: 16.2, variance: 2.3, count: 54, teacher: "Calibrated + Context Allowed" },
    sectionB: { avg: 16.4, variance: 2.2, count: 52, teacher: "Calibrated Standard" },
    sectionC: { avg: 16.1, variance: 2.4, count: 54, teacher: "Calibrated + Context Allowed" },
    discrepancyGap: 0.3
  }
};

