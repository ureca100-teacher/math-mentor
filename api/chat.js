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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `당신은 31년 경력의 수학 선생님입니다. 개념 중심으로 친절하고 따뜻하게 설명합니다. 중간 실력 학생도 이해할 수 있도록 쉽게 설명해주세요. 앞서 풀이한 문제 정보: ${context}`,
        messages
      })
    });
 
    const data = await response.json();
    const reply = data.content.map(i => i.text || '').join('');
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
