import { useState } from 'react';
import type { Repo } from '../types/repo';
import { isFileProtocol, resolveThumbUrl } from '../lib/sample';

interface RepoThumbProps {
  repo: Repo;
  size?: 'sm' | 'md' | 'lg';
}

export function RepoThumb({ repo, size = 'sm' }: RepoThumbProps) {
  const [failed, setFailed] = useState(false);
  const hasThumb = Boolean(repo.sample.thumbPath) && !failed;

  if (hasThumb) {
    return (
      <img
        className={`repo-thumb repo-thumb-${size}`}
        src={resolveThumbUrl(repo.id)}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={`repo-thumb repo-thumb-${size} repo-thumb-fallback`}
      title={
        isFileProtocol()
          ? '缩略图缺失：资源未随文件一起拷贝'
          : '该仓库未生成可用样例'
      }
    >
      无样例
    </span>
  );
}
