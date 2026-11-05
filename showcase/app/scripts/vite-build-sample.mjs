#!/usr/bin/env node
/** 仅用于真实数据尚未接入时的占位构建；最终交付必须运行 npm run build。 */
process.env.SHOWCASE_ALLOW_SAMPLE = '1';
const { build } = await import('vite');
await build();
