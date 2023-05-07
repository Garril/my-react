import path from 'path';
import fs from 'fs';

import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

const packagePath = path.resolve(__dirname, '../../packages');
const distPath = path.resolve(__dirname, '../../dist/node_modules');
// 包路径获取（两种：源码的路径、打包后的路径）
export function resolvePackagePath(packageName, isDist) {
  if (isDist) {
    return `${distPath}/${packageName}`;
  }
  return `${packagePath}/${packageName}`;
}

export function getPackageJson(packageName) {
  // 包路径
  const path = `${resolvePackagePath(packageName)}/package.json`;
  const str = fs.readFileSync(path, {
    encoding: 'utf-8'
  });
  return JSON.parse(str);
}

export function getBaseRollupPlugins({
  alias = {
    __DEV__: true
  },
  typescript = {}
} = {}) {
  // 目前需要两个rollup的plugin
  // 1：解析commonJS规范的plugin
  // 2: 将源码中ts转为js的plugin
  return [replace(alias), cjs(), ts(typescript)];
}
