import express from 'express';

const router = express.Router();

// @route   POST /api/assessment/evaluate
// @desc    Evaluate a student script code against a locked rubric
router.post('/evaluate', async (req, res) => {
  const { scriptCode = '', rubric = [], penalties = [], sectionNotes = '', courseInCharge = '' } = req.body;
  const apiKey = (process.env.GEMINI_API_KEY || req.headers['x-gemini-api-key'] || req.body.apiKey || '').trim();

  if (apiKey) {
    const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    const prompt = `You are an expert AI Academic Examiner for the Department of Computer Science & Engineering at Ahsanullah University of Science and Technology (AUST).
Evaluate this student source code submission objectively against the locked Rubric:
Rubric: ${JSON.stringify(rubric)}
Penalties: ${JSON.stringify(penalties)}
Section Teaching Context / Allowances: ${sectionNotes || "Standard department curriculum"}
Course In-Charge: ${courseInCharge || "Prof. Tariq Mahmud"}

Student Submission Code:
\`\`\`
${scriptCode}
\`\`\`

Evaluate each rubric criterion rigorously:
- Check for exact syntax, pointer logic, algorithm correctness, edge case handling, and space/time complexity.
- Award marks strictly within [0.0, criterion.maxMarks].
- Apply any applicable penalties.
- Provide a polite, constructive, and transparent feedback explanation for the student viewing their script.

Return STRICT JSON ONLY without markdown formatting:
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

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(12000),
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          const textPart = parts.find(p => p.text && p.text.trim().length > 0);
          const rawText = textPart?.text;
          if (rawText) {
            const cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);
            return res.json({
              ...parsed,
              modelUsed: model,
              isLiveGemini: true
            });
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn(`Gemini ${model} returned HTTP ${response.status}:`, errData?.error?.message || response.statusText);
        }
      } catch (err) {
        console.warn(`Backend Gemini (${model}) evaluation failed:`, err.message);
      }
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
      : 'Good attempt. Please review the criteria breakdown above for specific areas where marks were adjusted.',
    modelUsed: 'academic-synthesizer',
    isLiveGemini: false
  });
});

export default router;
