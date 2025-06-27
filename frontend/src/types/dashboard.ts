export interface Target {
  id: string;
  username: string;
  templateTag: string;
  createdAt: string;
}

export interface Template {
  id: string;
  intent: string;
  title: string;
  content: string;
  tags: string[];
}

export interface Stats {
  totalMessages: number;
  averageResponseTime: number;
  messagesByIntent: Record<string, number>;
}
