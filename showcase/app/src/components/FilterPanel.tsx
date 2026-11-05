import { useState } from 'react';
import type { FilterState, TriState } from '../types/repo';
import { countActiveFilters, hasActiveFilters, toggleFilterValue } from '../lib/filter';
import { Icon } from './Icon';

interface FilterOptions {
  categories: string[];
  languages: string[];
  licenses: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  options: FilterOptions;
  shown: number;
  total: number;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ok', label: '出片成功' },
  { value: 'failed', label: '渲染失败' },
  { value: 'skipped', label: '不可出片' },
];

const TRI_OPTIONS: Array<{ value: TriState; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'yes', label: '支持' },
  { value: 'no', label: '不支持' },
];

interface ChipButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function ChipButton({ active, label, onClick }: ChipButtonProps) {
  return (
    <button
      type="button"
      className={`chip${active ? ' is-active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

interface SegmentProps {
  label: string;
  value: TriState;
  options: Array<{ value: TriState; label: string }>;
  onChange: (value: TriState) => void;
}

function Segment({ label, value, options, onChange }: SegmentProps) {
  return (
    <div className="segmented-field">
      <span className="field-label">{label}</span>
      <div className="segment" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`segment-button${value === option.value ? ' is-active' : ''}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FilterPanel({
  filters,
  options,
  shown,
  total,
  onChange,
  onReset,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = countActiveFilters(filters);

  return (
    <section className="filter-panel" aria-label="筛选与搜索">
      <div className="filter-toolbar">
        <label className="search-field">
          <Icon name="search" size={16} />
          <span className="sr-only">搜索仓库名、描述或标签</span>
          <input
            type="search"
            value={filters.q}
            placeholder="搜索仓库名 / 描述 / 标签"
            onChange={(event) => onChange({ ...filters, q: event.target.value })}
          />
          {filters.q ? (
            <button
              type="button"
              className="icon-button search-clear"
              aria-label="清空搜索"
              onClick={() => onChange({ ...filters, q: '' })}
            >
              <Icon name="close" size={14} />
            </button>
          ) : null}
        </label>
        <div className="filter-result mono" aria-live="polite">
          {shown} <span>/ {total}</span>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          更多筛选
          <Icon name="chevron" size={14} className={expanded ? 'is-rotated' : ''} />
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={onReset}
          disabled={!hasActiveFilters(filters)}
        >
          <Icon name="reset" size={15} />
          重置{activeCount > 0 ? `（${activeCount}）` : ''}
        </button>
      </div>

      <div className="filter-row">
        <span className="field-label">分类</span>
        <div className="chip-group">
          <ChipButton
            active={filters.categories.length === 0}
            label="全部"
            onClick={() => onChange({ ...filters, categories: [] })}
          />
          {options.categories.map((category) => (
            <ChipButton
              key={category}
              active={filters.categories.includes(category)}
              label={category}
              onClick={() =>
                onChange({
                  ...filters,
                  categories: toggleFilterValue(filters.categories, category),
                })
              }
            />
          ))}
        </div>
      </div>

      <div className="filter-row">
        <span className="field-label">样例</span>
        <div className="chip-group">
          <ChipButton
            active={filters.statuses.length === 0}
            label="全部"
            onClick={() => onChange({ ...filters, statuses: [] })}
          />
          {STATUS_OPTIONS.map((option) => (
            <ChipButton
              key={option.value}
              active={filters.statuses.includes(option.value)}
              label={option.label}
              onClick={() =>
                onChange({
                  ...filters,
                  statuses: toggleFilterValue(filters.statuses, option.value),
                })
              }
            />
          ))}
        </div>
        <Segment
          label="Windows"
          value={filters.windows}
          options={TRI_OPTIONS}
          onChange={(value) => onChange({ ...filters, windows: value })}
        />
        <Segment
          label="GPU"
          value={filters.gpu}
          options={[
            { value: 'all', label: '全部' },
            { value: 'yes', label: '需要/支持' },
            { value: 'no', label: '不需要' },
          ]}
          onChange={(value) => onChange({ ...filters, gpu: value })}
        />
      </div>

      {expanded ? (
        <div className="filter-extra">
          <div className="filter-row">
            <span className="field-label">语言</span>
            <div className="chip-group">
              <ChipButton
                active={filters.languages.length === 0}
                label="全部"
                onClick={() => onChange({ ...filters, languages: [] })}
              />
              {options.languages.map((language) => (
                <ChipButton
                  key={language}
                  active={filters.languages.includes(language)}
                  label={language}
                  onClick={() =>
                    onChange({
                      ...filters,
                      languages: toggleFilterValue(filters.languages, language),
                    })
                  }
                />
              ))}
            </div>
          </div>
          <div className="filter-row">
            <span className="field-label">许可证</span>
            <div className="chip-group">
              <ChipButton
                active={filters.licenses.length === 0}
                label="全部"
                onClick={() => onChange({ ...filters, licenses: [] })}
              />
              {options.licenses.map((license) => (
                <ChipButton
                  key={license}
                  active={filters.licenses.includes(license)}
                  label={license}
                  onClick={() =>
                    onChange({ ...filters, licenses: toggleFilterValue(filters.licenses, license) })
                  }
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
