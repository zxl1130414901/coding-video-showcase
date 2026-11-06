import type { Dataset, RepoDetail, SampleFeatures } from '../types/repo';
import type { DiscoveryDoc } from '../types/discovery';
import { emptyIntents, type IntentDoc } from '../types/intents';

export interface DataSourceMeta {
  file: string;
  detailsDir: string;
  isSample: boolean;
  loadedAt: string;
  detailCount: number;
  missingDetailIds: string[];
  featureCount: number;
}

export interface SampleSizes {
  mainBytes?: number;
  basicBytes?: number;
}

export interface LoadedDataset {
  dataset: Dataset;
  details: Record<string, RepoDetail>;
  features: Record<string, SampleFeatures>;
  sampleSizes: Record<string, SampleSizes>;
  discovery: DiscoveryDoc;
  intents: IntentDoc;
  source: DataSourceMeta;
}

export const MIN_REPOS = 65;

/** 只读消费构建期注入的数据（真实 repos.json / 加密档案 / 能力分段）。 */
export async function loadDataset(): Promise<LoadedDataset> {
  const module = await import('virtual:repos');
  return {
    dataset: module.reposPayload,
    details: module.detailsPayload ?? {},
    features: module.featuresPayload ?? {},
    sampleSizes: module.sampleSizesPayload ?? {},
    discovery: module.discoveryPayload,
    intents: module.intentsPayload ?? emptyIntents(),
    source: module.dataSource,
  };
}

export function assertDataset(dataset: Dataset, isSample = false): void {
  if (!dataset || !Array.isArray(dataset.repos)) {
    throw new Error('数据格式错误：缺少 repos 数组。');
  }
  if (!isSample && dataset.repos.length < MIN_REPOS) {
    throw new Error(`数据条数不足：期望至少 ${MIN_REPOS} 条，实际 ${dataset.repos.length} 条。`);
  }
  dataset.repos.forEach((repo, index) => {
    if (!repo || typeof repo.id !== 'string' || typeof repo.repo !== 'string') {
      throw new Error(`数据格式错误：第 ${index + 1} 条仓库缺少 id/repo。`);
    }
    if (!repo.sample || !repo.scores) {
      throw new Error(`数据格式错误：仓库 ${repo.id} 缺少 sample/scores。`);
    }
  });
}
