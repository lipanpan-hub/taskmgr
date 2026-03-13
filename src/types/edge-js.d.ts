declare module 'edge-js' {
  interface EdgeOptions {
    references?: string[]
    source: string
  }

  interface EdgeFunction<TOutput> {
    (input: unknown, callback: (error: Error | null, result: TOutput) => void): void
    (input: unknown): Promise<TOutput>
  }

  interface Edge {
    func<TOutput>(code: string): EdgeFunction<TOutput>
    func<TOutput>(options: EdgeOptions): EdgeFunction<TOutput>
  }

  const edge: Edge
  export default edge
}