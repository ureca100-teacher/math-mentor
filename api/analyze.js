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
        // 모델명을 현재 사용 가능한 최신 것으로 수정했습니다.
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: `당신은 31년 경력의 수학 선생님입니다. 중간 실력 학생도 이해할 수 있도록 개념 중심으로 설명합니다.
반드시 아래 JSON 형식으로만 응답하세요. 마크다운 없이 순수 JSON만 출력하세요:
{"concepts":["개념1","개념2","개념3"],"steps":[{"num":1,"text":"설명"},{"num":2,"text":"설명"}],"answer":"최종 답"}
각 step은 왜 이 방법을 쓰는지 개념과 연결해서 친절하게 설명해 주세요.`,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
            { type: 'text', text: '이 수학 문제를 분석해주세요. 중간 실력 학생 기준으로 필요한 개념을 먼저 제시하고 단계별로 풀이해주세요.' }
          ]
        }]
      })
    });
 
    // API 응답이 성공인지 확인
    if (!response.ok) {
      const errorData = await response.json();
      console.error("API 에러 발생:", errorData);
      return res.status(500).json({ error: 'API 호출 실패', details: errorData });
    }

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    
    res.status(200).json(parsed);
    
  } catch (err) {
    // 상세 에러 로그를 남깁니다.
    console.error("서버 내부 에러:", err);
    res.status(500).json({ error: err.message });
  }
}
