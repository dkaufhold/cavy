export interface ITestHookStore {
  hooks: { [identifier: string]: React.Component }
}

export interface SpecFunction extends Function {
  givenName?: string
}

export interface TestCase {
  description: string
  f: SpecFunction
}

export interface TestResult {
  message: string
  passed: boolean
}

export interface TestReport {
  results: TestResult[]
  errorCount: number
  duration: number
}
