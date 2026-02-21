export interface IQueue {
  enqueue(jobName: string, data: Record<string, unknown>): Promise<string>;
  close(): Promise<void>;
}
