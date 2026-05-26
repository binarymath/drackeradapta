export function buildQuizPrompt(topic, lessonDetails, difficultyLabel, questionCount = 10, difficultyDist = { easy: 40, medium: 40, hard: 20 }) {
  // Calcula contagens exatas garantindo soma = questionCount
  const pEasy   = Math.max(0, difficultyDist.easy   || 0);
  const pMedium = Math.max(0, difficultyDist.medium || 0);
  const pHard   = Math.max(0, difficultyDist.hard   || 0);
  const total   = pEasy + pMedium + pHard || 100;

  let cEasy   = Math.round(questionCount * pEasy   / total);
  let cMedium = Math.round(questionCount * pMedium / total);
  let cHard   = questionCount - cEasy - cMedium;
  if (cHard < 0) { cMedium += cHard; cHard = 0; }
  if (cEasy < 0) { cMedium += cEasy; cEasy = 0; }

  // Sequência intercalada: E M H E M H E M H ...
  const seq = [];
  const buckets = [
    { label: 'easy',   count: cEasy   },
    { label: 'medium', count: cMedium },
    { label: 'hard',   count: cHard   },
  ];
  let changed = true;
  while (seq.length < questionCount && changed) {
    changed = false;
    for (const b of buckets) {
      if (b.count > 0 && seq.length < questionCount) {
        seq.push(b.label);
        b.count--;
        changed = true;
      }
    }
  }

  // Linha compacta: "Q1=easy Q2=medium Q3=hard Q4=easy ..."
  const diffLine = seq.map((d, i) => `Q${i + 1}=${d}`).join(' ');

  return `You are an educational quiz generator. Generate a quiz about: "${topic}".
Level: ${difficultyLabel}.
Additional context (mandatory): ${lessonDetails || 'none'}.

RETURN ONLY a valid JSON object. No markdown. No text before or after. No explanation.

JSON structure (repeat the questions array with EXACTLY ${questionCount} items):
{
  "intro_text": "short friendly intro about the topic",
  "questions": [
    {
      "statement": "question text here",
      "correct_answer": "the correct answer",
      "distractors": ["wrong answer 1", "wrong answer 2", "wrong answer 3", "wrong answer 4"],
      "difficulty": "easy"
    }
  ]
}

MANDATORY RULES (follow ALL of them):
1. questions array MUST have EXACTLY ${questionCount} items. Not less, not more.
2. Each question MUST have: statement, correct_answer, distractors (array of 4 strings), difficulty.
3. distractors MUST be an array with EXACTLY 4 non-empty strings. Never empty array.
4. difficulty MUST be exactly one of these three English strings: easy  medium  hard
5. Difficulty assignment per question (FOLLOW EXACTLY): ${diffLine}
   easy = simple/basic question. medium = intermediate. hard = complex/advanced.
6. Do NOT use double-quote characters (") inside any text value. Use single quotes if needed.
7. Return ONLY the JSON. Nothing else.`;
}
