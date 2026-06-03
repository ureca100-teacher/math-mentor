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
        // 모델명을 현재 사용 가능한 최신 것으로 수정했습니다.
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: `당신은 31년 경력의 수학 선생님입니다. 개념 중심으로 친절하고 따뜻하게 설명합니다. 중간 실력 학생도 이해할 수 있도록 쉽게 설명해주세요. 앞서 풀이한 문제 정보: ${context}`,
        messages
      })
    });
 
    // API 응답이 실패했을 경우 상세 내용을 로그에 남김
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Anthropic API Error Details:", errorData);
      return res.status(500).json({ error: 'API 호출 실패', details: errorData });
    }

    const data = await response.json();
    const reply = data.content.map(i => i.text || '').join('');
    res.status(200).json({ reply });
    
  } catch (err) {
    // 서버 내부에서 발생한 에러 기록
    console.error("서버 내부 에러:", err);
    res.status(500).json({ error: err.message });
  }
}
