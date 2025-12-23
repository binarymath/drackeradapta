export function parseQuestions(block) {
  if (!block) return [];
  const lines = block.split(/\n+/).map(l => l.trim()).filter(Boolean);
  return lines.map((line, idx) => {
    const pipe = line.match(/^\s*\d+[\.\)\]]?\s*(.*?)\s*\|\s*Correct\s*:\s*(.*?)\s*\|\s*Distractors\s*:\s*(.*)$/i);
    let textQ = '';
    let correct = '';
    let distractors = [];
    if (pipe) {
      textQ = pipe[1].trim();
      correct = pipe[2].trim();
      distractors = pipe[3].split(/;|\,/).map(d => d.trim()).filter(Boolean);
    } else {
      const parts = line.split(/\||;/).map(p => p.trim()).filter(Boolean);
      textQ = parts[0] || line.replace(/^\s*\d+[\.\)\]]?\s*/, '');
      correct = parts[1] || '';
      distractors = parts.slice(2).filter(Boolean);
    }
    const filledDistractors = distractors.slice(0, 3);
    // If the model returned fewer than 3 distractors, pad with generic fillers to avoid dropping the question.
    while (filledDistractors.length < 3) {
      filledDistractors.push(`Opção extra ${filledDistractors.length + 1}`);
    }

    const options = Array.from(new Set([correct, ...filledDistractors].filter(Boolean)));

    // Fisher-Yates Shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    const shuffled = options;

    if (!correct) return null;
    return {
      text: textQ || `Pergunta ${idx + 1}`,
      correctAnswer: correct,
      distractors: filledDistractors.slice(0, 3),
      options: shuffled.slice(0, 4),
      ordered_options: shuffled.slice(0, 4)
    };
  }).filter(Boolean);
}
