export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  const { messages, context } = req.body;
 
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `당신은 31년 경력의 수학 선생님입니다. 개념 중심으로 친절하게 설명합니다.
수식은 반드시 KaTeX 형식으로: 인라인은 $수식$, 블록은 $$수식$$
그리스 문자: \\alpha, \\beta, \\gamma 등 LaTeX 명령어 사용
분수: \\frac{분자}{분모} 형태로
한글 설명은 최소화하고 수식 중심으로.
앞서 풀이한 문제 정보: ${context}`,
        messages
      })
    });
 
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(500).json({ error: 'API 호출 실패', details: errorData });
    }
 
    const data = await response.json();
    const reply = data.content.map(i => i.text || '').join('');
    res.status(200).json({ reply });
 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
