export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const { imageData, mediaType } = req.body;
 
  try {
    // 1단계: Claude로 풀이 생성
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
반드시 아래 JSON 형식으로만 응답하세요. 순수 JSON만 출력하세요.
수식은 KaTeX 형식으로: 인라인은 $수식$, 블록은 $$수식$$
그리스 문자: \\alpha, \\beta, \\gamma 등 LaTeX 명령어 사용
분수: \\frac{분자}{분모} 형태로
wolfram_query: Wolfram Alpha에 검증할 수식 (영어로, 예: "solve x^2-3x+2=0")
{"concepts":["개념1","개념2"],"steps":[{"num":1,"text":"$수식$ 설명"},{"num":2,"text":"$$수식$$"}],"answer":"$최종답$","wolfram_query":"검증할 수식","graphs":["y=x^2"]}`,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
            { type: 'text', text: '이 수학 문제를 분석하고 KaTeX 수식과 Wolfram Alpha 검증 쿼리를 포함한 풀이를 JSON으로 제공해주세요.' }
          ]
        }]
      })
    });
 
    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.json();
      return res.status(500).json({ error: 'Claude API 오류', details: errorData });
    }
 
    const claudeData = await claudeResponse.json();
    const text = claudeData.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
 
    // 2단계: Wolfram Alpha로 답 검증
    if (parsed.wolfram_query && process.env.WOLFRAM_APP_ID) {
      try {
        const wolframUrl = `https://api.wolframalpha.com/v1/result?appid=${process.env.WOLFRAM_APP_ID}&i=${encodeURIComponent(parsed.wolfram_query)}`;
        const wolframResponse = await fetch(wolframUrl);
        if (wolframResponse.ok) {
          const wolframAnswer = await wolframResponse.text();
          parsed.wolfram_verified = wolframAnswer;
        }
      } catch (wolframErr) {
        parsed.wolfram_verified = null;
      }
    }
 
    res.status(200).json(parsed);
 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
