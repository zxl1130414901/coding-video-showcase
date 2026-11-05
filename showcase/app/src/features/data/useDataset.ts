import { useEffect, useState } from 'react';
import { assertDataset, loadDataset, type LoadedDataset } from '../../data';

export type DatasetState =
  | { status: 'loading' }
  | { status: 'ready'; data: LoadedDataset }
  | { status: 'error'; message: string };

export function useDataset(): DatasetState {
  const [state, setState] = useState<DatasetState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    loadDataset()
      .then((data) => {
        assertDataset(data.dataset, data.source.isSample);
        if (active) setState({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : '未知错误';
        if (active) setState({ status: 'error', message });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
