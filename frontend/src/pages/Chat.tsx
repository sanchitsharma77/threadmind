import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Thread {
  thread_id: string;
  users: { username: string }[];
  last_activity?: string;
}

interface Message {
  id: string;
  from_user: string;
  text: string;
  timestamp?: string;
  seen?: boolean;
}

const Chat = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingReply, setLoadingReply] = useState(false);

  // Fetch all threads on mount
  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      const logs = await res.json();
      // Extract unique thread_ids and usernames
      const threadMap: Record<string, Thread> = {};
      logs.forEach((log: any) => {
        if (!threadMap[log.thread_id]) {
          threadMap[log.thread_id] = {
            thread_id: log.thread_id,
            users: [{ username: log.username }],
            last_activity: log.timestamp,
          };
        }
      });
      setThreads(Object.values(threadMap));
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load threads', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (thread: Thread) => {
    setSelectedThread(thread);
    setLoading(true);
    setAiReply(null);
    try {
      const res = await fetch(`/api/thread/${thread.thread_id}/messages`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
        // Suggest AI reply for the latest user message
        if (data.messages.length > 0) {
          const lastMsg = data.messages[data.messages.length - 1];
          suggestAIReply(lastMsg);
        }
      } else {
        setMessages([]);
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load messages', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const suggestAIReply = async (msg: Message) => {
    setLoadingReply(true);
    setAiReply(null);
    try {
      const res = await fetch('/api/process_messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ ...msg }]),
      });
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.suggestion) {
        setAiReply(data[0].suggestion);
      }
    } catch (e) {
      setAiReply(null);
    } finally {
      setLoadingReply(false);
    }
  };

  const handleCopy = () => {
    if (aiReply) {
      navigator.clipboard.writeText(aiReply);
      toast({ title: 'Copied!', description: 'AI reply copied to clipboard.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">💬 Chat with your DMs</h1>
      <div className="flex gap-8">
        {/* Thread list */}
        <div className="w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Threads</CardTitle>
              <CardDescription>Select a thread to view conversation</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Loading...</div>
              ) : (
                <ul className="space-y-2">
                  {threads.map((thread) => (
                    <li key={thread.thread_id}>
                      <Button
                        variant={selectedThread?.thread_id === thread.thread_id ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => fetchMessages(thread)}
                      >
                        {thread.users.map(u => u.username).join(', ')}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Conversation view */}
        <div className="flex-1">
          {selectedThread ? (
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>Thread ID: {selectedThread.thread_id}</CardDescription>
                <Button variant="ghost" size="sm" onClick={() => setSelectedThread(null)} className="mt-2">Back to threads</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {messages.map((msg, idx) => (
                    <div key={msg.id || idx} className={`flex ${msg.from_user === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-lg px-4 py-2 ${msg.from_user === 'me' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'}`}>
                        <div className="text-xs text-gray-500">{msg.from_user}</div>
                        <div>{msg.text}</div>
                        {msg.timestamp && <div className="text-[10px] text-gray-400">{new Date(msg.timestamp).toLocaleString()}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                {/* AI reply suggestion */}
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">AI Reply Suggestion</h3>
                  {loadingReply ? (
                    <div>Loading AI reply...</div>
                  ) : aiReply ? (
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 text-green-900 rounded px-3 py-2">{aiReply}</div>
                      <Button size="sm" onClick={handleCopy}>Use AI Reply</Button>
                    </div>
                  ) : (
                    <div className="text-gray-400">No suggestion available.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-gray-500 mt-12 text-center">Select a thread to start chatting!</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat; 