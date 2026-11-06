/** 与 ..\data\intents.json 严格对齐（构建期语料，运行时不请求网络）。 */

export interface IntentEntry {
  /** 用户口吻的说法，12–25 字，第一人称，可带条件从句。 */
  q: string;
  /** discovery.json 的 10 个场景 id 之一。 */
  scenario: string;
}

export interface IntentDoc {
  updatedAt?: string;
  repos: Record<string, IntentEntry[]>;
  scenarios: Record<string, string[]>;
  global: string[];
}

export function emptyIntents(): IntentDoc {
  return { repos: {}, scenarios: {}, global: [] };
}
