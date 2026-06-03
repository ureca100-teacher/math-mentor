export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const { imageData, mediaType } = req.body;
 
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
        max_tokens: 2000,
        system: `당신은 31년 경력의 수학 선생님입니다. 중간 실력 학생도 이해할 수 있도록 개념 중심으로 풀이합니다.
 
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만 출력하세요.
 
규칙:
1. 수식은 반드시 KaTeX 형식으로 작성하세요. 인라인 수식은 $수식$, 블록 수식은 $$수식$$ 형태로.
2. 그리스 문자는 반드시 LaTeX 명령어 사용: \\alpha, \\beta, \\gamma, \\delta 등
3. 분수는 반드시 \\frac{분자}{분모} 형태로
4. 절댓값은 |수식| 형태로
5. 한글 설명은 최소화하고 수식 중심으로 표현
6. 함수, 미적분, 방정식 등 그래프가 필요한 문제는 graphs 배열에 Desmos LaTeX 수식 포함
7. 각 step은 핵심만 간결하게
 
{"concepts":["개념1","개념2"],"steps":[{"num":1,"text":"설명과 $수식$ 혼합"},{"num":2,"text":"$$블록수식$$"}],"answer":"$최종답$","graphs":["y=x^2+1"]}`,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
            { type: 'text', text: '이 수학 문제를 분석하고 KaTeX 수식과 그래프를 포함한 풀이를 JSON으로 제공해주세요.' }
          ]
        }]
      })
    });
 
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(500).json({ error: 'API 호출 실패', details: errorData });
    }
 
    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
