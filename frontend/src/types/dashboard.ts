export interface Stats {
  totalMessages: number;
  averageResponseTime: number;
  messagesByIntent: Record<string, number>;
}
