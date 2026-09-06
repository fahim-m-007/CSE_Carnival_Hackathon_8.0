import express from 'express';

const router = express.Router();

// @route   POST /api/rubric/generate
// @desc    Generate standardized OBE Rubric using Gemini API or built-in academic synthesizer
router.post('/generate', async (req, res) => {
  const { questionPrompt, totalMarks, solutionNotes, bloomsLevel, sectionContext } = req.body;
  const apiKey = (process.env.GEMINI_API_KEY || req.headers['x-gemini-api-key'] || req.body.apiKey || '').trim();

  if (apiKey) {
    const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    const systemInstruction = `You are an expert academic evaluator and OBE (Outcome-Based Education) coordinator for the Department of Computer Science & Engineering at Ahsanullah University of Science and Technology (AUST). 
Decompose the university exam question into an objective, standardized grading rubric with clear criteria, mark weightages summing exactly to ${totalMarks}, Bloom's taxonomy levels, and partial credit guides. Also identify reasonable penalty rules.

Return STRICT JSON format only:
{
  "criteria": [
    {
      "id": "crit_1",
      "title": "Short title",
      "weight": number,
      "maxMarks": number,
      "bloomLevel": "Remember/Understand/Apply/Analyze/Evaluate",
      "description": "What is evaluated",
      "fullCredit": "Criteria for 100% credit",
      "partialCredit": "Criteria for 50% partial credit",
      "zeroCredit": "Criteria for 0% credit"
    }
  ],
  "penalties": [
    {
      "id": "pen_1",
      "title": "Penalty name",
      "deduction": number,
      "description": "Condition for deduction"
    }
  ],
  "sectionGuidanceNote": "How section-specific nuances or teaching allowances should be treated"
}`;

    const userContent = `Exam Question: ${questionPrompt || "Write an algorithm or function to solve the problem."}
Total Marks: ${totalMarks || 5.0}
Blooms Taxonomy Target: ${bloomsLevel || "Apply / Analyze"}
Teacher's Key Notes / Expected Solution: ${solutionNotes || "Standard optimal algorithm required"}
Section Teaching Context / Allowances: ${sectionContext || "Standard syllabus"}`;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(12000),
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemInstruction}\n\n${userContent}` }] }],
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
        console.warn(`Backend Gemini (${model}) rubric generation failed:`, err.message);
      }
    }
  }

  // Academic OBE Decomposition Fallback Synthesizer
  const total = parseFloat(totalMarks) || 5.0;
  const part1 = Number((total * 0.2).toFixed(1));
  const part2 = Number((total * 0.5).toFixed(1));
  const part3 = Number((total - part1 - part2).toFixed(1));

  res.json({
    criteria: [
      {
        id: 'crit_1',
        title: 'Base & Edge Cases Handling',
        weight: part1,
        maxMarks: part1,
        bloomLevel: 'Understand',
        description: 'Checks for boundary conditions, null references, and single-element edge inputs.',
        fullCredit: `Boundary inputs correctly anticipated and safeguarded without runtime crash (${part1} M).`,
        partialCredit: `Validation present but minor off-by-one or single-node case overlooked (${(part1/2).toFixed(1)} M).`,
        zeroCredit: 'No validation; crashes on boundary or empty data structures (0.0 M).'
      },
      {
        id: 'crit_2',
        title: 'Core Algorithm Logic & Traversal',
        weight: part2,
        maxMarks: part2,
        bloomLevel: 'Apply',
        description: 'Logical precision of pointer/index reassignments and state transitions.',
        fullCredit: `Algorithmic steps are mathematically sound and optimal (${part2} M).`,
        partialCredit: `Conceptually valid, but minor state-tracking or traversal glitch occurs (${(part2/2).toFixed(1)} M).`,
        zeroCredit: 'Completely flawed algorithm or broken logic structure (0.0 M).'
      },
      {
        id: 'crit_3',
        title: 'Integrity, Return Value & Space Limit',
        weight: part3,
        maxMarks: part3,
        bloomLevel: 'Analyze',
        description: 'Returns correct result reference without leaking memory or violating space constraints.',
        fullCredit: `Returns new result pointer, no memory leaks, respects O(1) auxiliary space (${part3} M).`,
        partialCredit: `Inverts or calculates correctly but return pointer loses caller reference (${(part3/2).toFixed(1)} M).`,
        zeroCredit: 'Returns stale/corrupted reference leading to data loss (0.0 M).'
      }
    ],
    penalties: [
      {
        id: 'pen_1',
        title: 'Auxiliary Space / Complexity Violation',
        deduction: Number((total * 0.3).toFixed(1)),
        description: 'Used auxiliary vectors, lists, or arrays when O(1) space was required.'
      },
      {
        id: 'pen_2',
        title: 'Dangling Reference / Memory Defect',
        deduction: 0.5,
        description: 'Leaves unreferenced nodes or memory leaks.'
      }
    ],
    sectionGuidanceNote: sectionContext 
      ? `Active Section Allowance: "${sectionContext}" - Do not penalize syntactic or structural conventions approved by Course In-Charge.`
      : 'Standardized departmental assessment across all sections.'
  });
});

export default router;
