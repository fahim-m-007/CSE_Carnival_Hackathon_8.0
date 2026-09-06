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

export const INITIAL_COURSES = [
  {
    id: "course_cse2101",
    code: "CSE 2101",
    title: "Data Structures",
    batch: "Batch 53",
    term: "Spring 2026",
    creatorId: "fac_01", // Prof. Tariq
    creatorName: "Prof. Tariq Mahmud",
    sections: [
      {
        id: "sec_a",
        name: "Section A",
        enrolled: 54,
        teacherId: "fac_01",
        teacherName: "Prof. Tariq Mahmud",
        teacherDesignation: "Professor",
        role: "Course In-Charge",
        teachingNotes: "Iterative 3-pointer method emphasized. Stressed empty and single-node list edge cases. 0-based indexing used."
      },
      {
        id: "sec_b",
        name: "Section B",
        enrolled: 52,
        teacherId: "fac_02",
        teacherName: "Lec. Nusrat Jahan",
        teacherDesignation: "Lecturer",
        role: "Question Paper Setter & Section Teacher",
        teachingNotes: "Followed standard textbook syntax. Set the common question paper for all sections."
      },
      {
        id: "sec_c",
        name: "Section C",
        enrolled: 54,
        teacherId: "fac_01",
        teacherName: "Prof. Tariq Mahmud",
        teacherDesignation: "Professor",
        role: "Course In-Charge",
        teachingNotes: "Permitted standard iterative approach or recursive helper approach if in-place."
      }
    ],
    invitations: [
      {
        id: "inv_01",
        inviteeEmail: "nusrat.cse@aust.edu",
        inviteeName: "Lec. Nusrat Jahan",
        designation: "Lecturer",
        assignedSection: "Section B",
        status: "ACCEPTED",
        invitedAt: "2026-02-10"
      }
    ],
    exams: [
      {
        id: "exam_mid",
        title: "Midterm Examination",
        date: "2026-03-15",
        totalMarks: 20.0,
        questionsCount: 4,
        status: "GRADING_IN_PROGRESS"
      }
    ]
  },
  {
    id: "course_cse3103",
    code: "CSE 3103",
    title: "Database Management Systems",
    batch: "Batch 51",
    term: "Spring 2026",
    creatorId: "fac_01",
    creatorName: "Prof. Tariq Mahmud",
    sections: [
      {
        id: "sec_3103_a",
        name: "Section A",
        enrolled: 50,
        teacherId: "fac_01",
        teacherName: "Prof. Tariq Mahmud",
        teacherDesignation: "Professor",
        role: "Course In-Charge",
        teachingNotes: "B+ Tree indexing and relational algebra."
      },
      {
        id: "sec_3103_b",
        name: "Section B",
        enrolled: 48,
        teacherId: "fac_03",
        teacherName: "Dr. Kazi Tanvir Ahmed",
        teacherDesignation: "Associate Professor",
        role: "Section Teacher",
        teachingNotes: "SQL query optimization focus."
      }
    ],
    invitations: [
      {
        id: "inv_02",
        inviteeEmail: "tanvir.cse@aust.edu",
        inviteeName: "Dr. Kazi Tanvir Ahmed",
        designation: "Associate Professor",
        assignedSection: "Section B",
        status: "ACCEPTED",
        invitedAt: "2026-02-12"
      }
    ],
    exams: [
      {
        id: "exam_quiz1",
        title: "Class Test 1 (Normalization)",
        date: "2026-02-28",
        totalMarks: 10.0,
        questionsCount: 2,
        status: "COMPLETED"
      }
    ]
  }
];

export const DEFAULT_QUESTION = {
  id: "q_mid_01",
  number: "Question 2(b)",
  title: "In-Place Singly Linked List Reversal",
  prompt: "Write an algorithm or C++ function to reverse a singly linked list in O(n) time and O(1) auxiliary space. Clearly handle edge cases and return the pointer to the new head of the reversed list.",
  totalMarks: 5.0,
  bloomsLevel: "Apply / Analyze (Level 3-4)",
  authorInstructor: "Lec. Nusrat Jahan (Section B)",
  solutionNotes: "Must use iterative 3-pointer manipulation (prev, curr, next). Must handle empty list (head == NULL) and single node gracefully. Must return prev as new head. Penalize any auxiliary arrays or O(n) space.",
  sectionSpecificAllowances: {
    sec_a: "Prof. Tariq Mahmud: Accept both nullptr and NULL. In Section A, students were told returning prev without modifying head variable in caller is full credit if function returns Node*.",
    sec_c: "Prof. Tariq Mahmud: Both iterative 3-pointer and in-place helper recursion accepted if auxiliary stack is noted."
  }
};

export const INITIAL_RUBRIC_CRITERIA = [
  {
    id: "crit_1",
    title: "Base & Edge Cases",
    weight: 1.0,
    maxMarks: 1.0,
    bloomLevel: "Understand",
    description: "Correct handling of empty list (head == NULL) and single-node list (head->next == NULL).",
    fullCredit: "Gracefully returns head or NULL without segmentation fault (1.0 mark).",
    partialCredit: "Checks for NULL head but misses single-node condition or minor boundary bug (0.5 marks).",
    zeroCredit: "No edge case handling; triggers null pointer dereference (0.0 marks)."
  },
  {
    id: "crit_2",
    title: "Core Pointer Reversal Logic",
    weight: 2.5,
    maxMarks: 2.5,
    bloomLevel: "Apply",
    description: "Iterative 3-pointer traversal (prev, curr, next) reversing links in O(n) time.",
    fullCredit: "Flawless loop structure, correct next storage, curr->next reversal, and pointer shifting (2.5 marks).",
    partialCredit: "3-pointer strategy used, but order of assignment contains a flaw or lost pointer (1.0 - 1.5 marks).",
    zeroCredit: "Completely flawed traversal logic, infinite loop, or disconnected nodes (0.0 marks)."
  },
  {
    id: "crit_3",
    title: "Return Value & List Integrity",
    weight: 1.5,
    maxMarks: 1.5,
    bloomLevel: "Analyze",
    description: "Correctly updates head or returns 'prev' as the new head pointer of the reversed list.",
    fullCredit: "Returns new head (prev) and ensures original head now points to NULL as tail (1.5 marks).",
    partialCredit: "List is inverted but returns void or forgets to return prev to caller (0.5 marks).",
    zeroCredit: "Returns original head (which now points to NULL, losing the entire list) (0.0 marks)."
  }
];

export const INITIAL_PENALTIES = [
  {
    id: "pen_1",
    title: "Auxiliary Space Violation (> O(1))",
    deduction: 1.5,
    description: "Used vector, stack, or auxiliary array to store values rather than in-place reversal."
  },
  {
    id: "pen_2",
    title: "Memory Leak / Dangling Pointer",
    deduction: 0.5,
    description: "Leaves intermediate nodes unreferenced or introduces dangling memory."
  }
];

export const INITIAL_STUDENT_SCRIPTS = [
  {
    id: "scr_01",
    studentId: "20210104055",
    studentName: "Adnan Chowdhury",
    section: "sec_a",
    sectionName: "Section A",
    sectionTeacher: "Prof. Tariq Mahmud",
    submittedCode: `// Section A Student - Submitted Midterm Script
Node* reverseList(Node* head) {
    if (head == nullptr || head->next == nullptr) {
        return head;
    }
    Node* prev = nullptr;
    Node* curr = head;
    Node* next = nullptr;

    while (curr != nullptr) {
        next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}`,
    baseAiScore: 5.0,
    maxMarks: 5.0,
    status: "APPROVED",
    evaluatorNotes: "Perfect implementation. Used nullptr as taught in Section A. Handled edge cases.",
    breakdown: [
      { criterionId: "crit_1", title: "Base & Edge Cases", awarded: 1.0, max: 1.0, comment: "Empty and single node both verified." },
      { criterionId: "crit_2", title: "Pointer Logic", awarded: 2.5, max: 2.5, comment: "Clean 3-pointer swap in O(n) time." },
      { criterionId: "crit_3", title: "Return Value", awarded: 1.5, max: 1.5, comment: "Returns prev pointer successfully." }
    ],
    courseTeacherAdjustment: 0,
    adjustmentReason: "",
    finalMarks: 5.0,
    feedbackNote: "Excellent work, Adnan! Flawless 3-pointer manipulation and full edge case coverage."
  },
  {
    id: "scr_02",
    studentId: "20210104082",
    studentName: "Sadia Rahman",
    section: "sec_a",
    sectionName: "Section A",
    sectionTeacher: "Prof. Tariq Mahmud",
    submittedCode: `// Section A Student
Node* reverseList(Node* head) {
    // Taught in Sec A lecture week 4: In-place helper recursion
    if (head == nullptr || head->next == nullptr) return head;
    Node* rest = reverseList(head->next);
    head->next->next = head;
    head->next = nullptr;
    return rest;
}`,
    baseAiScore: 3.5,
    maxMarks: 5.0,
    status: "MODERATION_PENDING",
    evaluatorNotes: "Peer marker note: Student used recursion which consumes O(n) call stack space. Penalized 1.5 marks.",
    breakdown: [
      { criterionId: "crit_1", title: "Base & Edge Cases", awarded: 1.0, max: 1.0, comment: "Correct base condition." },
      { criterionId: "crit_2", title: "Pointer Logic", awarded: 2.5, max: 2.5, comment: "Recursive head->next->next pointer reversal is correct." },
      { criterionId: "crit_3", title: "Return Value", awarded: 1.5, max: 1.5, comment: "Returns rest head correctly." },
      { criterionId: "pen_1", title: "Space Penalty", awarded: -1.5, max: 0.0, comment: "Auxiliary call stack > O(1)." }
    ],
    courseTeacherAdjustment: 1.5,
    adjustmentReason: "Class Context Allowance: Covered recursive in-place method in Week 4 Section A lecture. Full credit granted by Course Teacher.",
    finalMarks: 5.0,
    feedbackNote: "Recursive logic is mathematically sound. While call stack uses O(n) frames, Prof. Tariq Mahmud approved this variation per Section A lecture guidelines."
  },
  {
    id: "scr_03",
    studentId: "20210104118",
    studentName: "Tanvir Hossain",
    section: "sec_b",
    sectionName: "Section B",
    sectionTeacher: "Lec. Nusrat Jahan",
    submittedCode: `// Section B Student
Node* reverseList(Node* head) {
    Node* p = NULL;
    Node* c = head;
    while(c != NULL) {
        Node* n = c->next;
        c->next = p;
        p = c;
        c = n;
    }
    return head; // Forgot prev
}`,
    baseAiScore: 3.5,
    maxMarks: 5.0,
    status: "APPROVED",
    evaluatorNotes: "Standard 3-pointer logic correct. Deducted 1.5 marks for returning head instead of prev per locked rubric.",
    breakdown: [
      { criterionId: "crit_1", title: "Base & Edge Cases", awarded: 1.0, max: 1.0, comment: "Implicit empty check succeeds." },
      { criterionId: "crit_2", title: "Pointer Logic", awarded: 2.5, max: 2.5, comment: "Correct pointer traversal." },
      { criterionId: "crit_3", title: "Return Value", awarded: 0.0, max: 1.5, comment: "Returned original head, losing list." }
    ],
    courseTeacherAdjustment: 0,
    adjustmentReason: "",
    finalMarks: 3.5,
    feedbackNote: "Your loop correctly inverts pointer directions. However, you returned 'head' which is now the last node; remember to return 'p' as the new head."
  },
  {
    id: "scr_04",
    studentId: "20210104142",
    studentName: "Nafisa Anjum",
    section: "sec_c",
    sectionName: "Section C",
    sectionTeacher: "Prof. Tariq Mahmud",
    submittedCode: `// Section C Student
Node* reverseList(Node* head) {
    std::vector<int> vals;
    Node* temp = head;
    while(temp != NULL) {
        vals.push_back(temp->data);
        temp = temp->next;
    }
    temp = head;
    for(int i = vals.size()-1; i >= 0; i--) {
        temp->data = vals[i];
        temp = temp->next;
    }
    return head;
}`,
    baseAiScore: 2.0,
    maxMarks: 5.0,
    status: "APPROVED",
    evaluatorNotes: "Severe space penalty: Copied data into std::vector instead of in-place pointer reversal. O(n) space violated.",
    breakdown: [
      { criterionId: "crit_1", title: "Base & Edge Cases", awarded: 1.0, max: 1.0, comment: "Handles empty list safely." },
      { criterionId: "crit_2", title: "Pointer Logic", awarded: 1.0, max: 2.5, comment: "Did not reverse pointers; modified node data values." },
      { criterionId: "crit_3", title: "Return Value", awarded: 1.5, max: 1.5, comment: "Returns head." },
      { criterionId: "pen_1", title: "Space Penalty", awarded: -1.5, max: 0.0, comment: "Violated O(1) space constraint by using std::vector." }
    ],
    courseTeacherAdjustment: 0,
    adjustmentReason: "",
    finalMarks: 2.0,
    feedbackNote: "You modified node data using a vector rather than reversing node links in-place. The question specifically mandated O(1) auxiliary space."
  }
];

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

