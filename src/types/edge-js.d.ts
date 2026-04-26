declare module 'edge-js' {
  interface EdgeOptions {
    references?: string[]
    source: string
  }

  interface EdgeFunction<TInput, TOutput> {
    (input: TInput, callback: (error: Error | null, result: TOutput) => void): void
    (input: TInput): Promise<TOutput>
  }

  interface Edge {
    func<TInput = unknown, TOutput = unknown>(code: string): EdgeFunction<TInput, TOutput>
    func<TInput = unknown, TOutput = unknown>(options: EdgeOptions): EdgeFunction<TInput, TOutput>
  }

  const edge: Edge
  export default edge
}