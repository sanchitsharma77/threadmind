import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const Playground = () => {
  const [input, setInput] = useState('');
  const [prompt, setPrompt] = useState('You are a helpful Instagram DM assistant.');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    setLoading(true);
    setReply('');
    setError('');
    try {
      const apiKey = window.prompt('Enter your OpenRouter API key:');
      if (!apiKey) {
        setError('API key required.');
        setLoading(false);
        return;
      }
      const res = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'DM Playground',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: input },
          ],
          temperature: 0.7,
          max_tokens: 256,
        }),
      });
      const data = await res.json();
      if (data.choices && data.choices[0]?.message?.content) {
        setReply(data.choices[0].message.content.trim());
      } else {
        setError('No reply from LLM.');
      }
    } catch (e: any) {
      setError('Error: ' + (e.message || e.toString()));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>🛠️ Agent Playground</CardTitle>
          <CardDescription>Simulate a DM and see the AI reply instantly (uses OpenRouter API directly)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Prompt (system message)</label>
            <textarea
              className="w-full border rounded p-2 text-sm font-mono"
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Your DM message</label>
            <input
              className="w-full border rounded p-2 text-base"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a DM message..."
            />
          </div>
          <Button onClick={handleSend} disabled={loading || !input}>
            {loading ? 'Generating...' : 'Get AI Reply'}
          </Button>
          {reply && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded p-4">
              <div className="text-xs text-gray-500 mb-1">AI Reply:</div>
              <div className="font-mono whitespace-pre-wrap">{reply}</div>
            </div>
          )}
          {error && (
            <div className="mt-4 text-red-600">{error}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Playground; 