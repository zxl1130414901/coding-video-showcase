declare module 'virtual:repos' {
  import type { Dataset, RepoDetail, SampleFeatures } from './repo';

  export const reposPayload: Dataset;
  export const detailsPayload: Record<string, RepoDetail>;
  export const featuresPayload: Record<string, SampleFeatures>;
  export const sampleSizesPayload: Record<string, { mainBytes?: number; basicBytes?: number }>;
  export const dataSource: {
    file: string;
    detailsDir: string;
    isSample: boolean;
    loadedAt: string;
    detailCount: number;
    missingDetailIds: string[];
    featureCount: number;
  };
}

interface Window {
  /** 单文件离线版：相对上文目录的视频根路径。 */
  __SAMPLE_BASE__?: string;
  /** HTTP 预览：交给本地中间件处理的视频根路径。 */
  __SAMPLE_BASE_HTTP__?: string;
  /** 缩略图根路径（dist/thumbs 与 dev 的 /thumbs 均可用）。 */
  __THUMB_BASE__?: string;
}
