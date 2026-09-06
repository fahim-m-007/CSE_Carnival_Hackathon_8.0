import express from 'express';

const router = express.Router();

// @route   POST /api/assessment/evaluate
// @desc    Evaluate a student script code against a locked rubric
router.post('/evaluate', async (req, res) => {
  const { scriptCode = '', rubric = [], penalties = [], sectionNotes = '', courseInCharge = '' } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are an AI Grading Mediator for AUST CSE Carnival.
Evaluate this student script against the locked Rubric:
Rubric: ${JSON.stringify(rubric)}
Penalties: ${JSON.stringify(penalties)}
Section Teaching Context: ${sectionNotes || "None"}
Course In-Charge: ${courseInCharge || "Prof. Tariq Mahmud"}

Student Script:
${scriptCode}

Return STRICT JSON:
{
  "totalAwarded": number,
  "evaluatorNotes": "string",
  "breakdown": [
    {
      "criterionId": "string",
      "title": "string",
      "awarded": number,
      "max": number,
      "comment": "string"
    }
  ],
  "feedbackNote": "Constructive, transparent feedback explanation for the student."
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          return res.json(JSON.parse(rawText));
        }
      }
    } catch (err) {
      console.warn('Backend live Gemini evaluation failed, falling back:', err.message);
    }
  }

  // Academic Rule-Based Evaluator
  const code = scriptCode.toLowerCase();
  const hasNullCheck = code.includes('null') || code.includes('nullptr');
  const hasVector = code.includes('vector') || code.includes('arraylist') || code.includes('new int[');
  const returnsPrev = code.includes('return prev') || code.includes('return p;') || code.includes('return head;');
  const hasRecursion = code.includes('reverselist(') && scriptCode.split('reverseList(').length > 2;

  let breakdown = [];
  let totalScore = 0;

  rubric.forEach(crit => {
    let score = crit.maxMarks;
    let note = 'Requirement fully satisfied per locked rubric standard.';

    if (crit.id === 'crit_1' || crit.title.toLowerCase().includes('edge') || crit.title.toLowerCase().includes('base')) {
      if (!hasNullCheck) {
        score = 0.0;
        note = 'Missing explicit null or boundary verification.';
      } else {
        score = crit.maxMarks;
        note = 'Handled edge cases and null references safely.';
      }
    } else if (crit.id === 'crit_2' || crit.title.toLowerCase().includes('logic') || crit.title.toLowerCase().includes('algorithm')) {
      if (hasVector) {
        score = Math.max(0.5, crit.maxMarks * 0.4);
        note = 'Substituted auxiliary container instead of in-place node manipulation.';
      } else {
        score = crit.maxMarks;
        note = 'Core algorithmic traversal and logic flow are sound.';
      }
    } else if (crit.id === 'crit_3' || crit.title.toLowerCase().includes('return') || crit.title.toLowerCase().includes('integrity')) {
      if (!returnsPrev && !hasRecursion) {
        score = 0.0;
        note = 'Did not return correct pointer reference; caller state severed.';
      } else {
        score = crit.maxMarks;
        note = 'Returns valid pointer reference meeting space limits.';
      }
    }

    breakdown.push({
      criterionId: crit.id,
      title: crit.title,
      awarded: score,
      max: crit.maxMarks,
      comment: note
    });
    totalScore += score;
  });

  if (hasVector) {
    const pen = penalties[0] || { deduction: 1.5, title: 'Space Penalty' };
    breakdown.push({
      criterionId: 'pen_1',
      title: pen.title,
      awarded: -pen.deduction,
      max: 0.0,
      comment: 'Auxiliary space penalty applied per course rubric.'
    });
    totalScore = Math.max(0, totalScore - pen.deduction);
  }

  res.json({
    totalAwarded: Number(totalScore.toFixed(1)),
    evaluatorNotes: 'Automated Evaluation against Locked Rubric completed.',
    breakdown,
    feedbackNote: totalScore >= 4.0
      ? 'Outstanding submission! Your algorithm logic, edge case handling, and space complexity fully satisfy the course standards.'
      : 'Good attempt. Please review the criteria breakdown above for specific areas where marks were adjusted.'
  });
});

export default router;
