# my-react

<hr/>

## jsx

在packages/react文件夹下 pnpm init

修改package.json文件，可以看到main字段，代表包入口文件（commonJS规范）

```json
{
  "name": "react",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}

```

但是rollup是原生支持esModule，所以改为：

```json
{
  "name": "react",
  "version": "1.0.0",
  "description": "react Common Methods",
  "module": "index.ts",
  "dependencies": {
    "shared": "workspace:*"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

dependencies --> react引用了shared中的文件，需要把shared定义为依赖（mono-repo的写法）

代表在pnpm的workspace下，mono-repo的结构中，react的包依赖了shared的包

### jsx转换

在babeljs.io网站，我们可以看到

```jsx
<div id="test">123</div>
// 转换为
import { jsx as _jsx } from "react/jsx-runtime";
/*#__PURE__*/_jsx("div", {
  id: "test",
  children: "123"
});
// 在react17之前，是React.createElement，17之后就是jsx方法的调用
```

### jsx的两部分

第一部分是编译时，就是上面的例子的过程。（babel编译实现，已经实现）

第二部分是运行时，就是项目运行的时候，`jsx或者React.createElement`方法的执行（jsx方法在dev和prod两个环境的实现，我们需要实现的）

工作量如下：

1、实现jsx方法

2、实现打包流程

3、实现调试打包结果的环境

### rollup打包plugin

两个plugin，一个commonjs规范的，一个ts转js的

```css
pnpm i -D -w rollup-plugin-typescript2
pnpm i -D -w @rollup/plugin-commonjs
```

目前实现打包出3个文件，react包的index.js以及 jsx-runtime和jsx-dev-runtime（后面连个暂时一样）

#### utils

```js
import path from 'path';
import fs from 'fs';

import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';

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
  typescript = {}
} = {}) {
  // 目前需要两个rollup的plugin
  // 1：解析commonJS规范的plugin
  // 2: 将源码中ts转为js的plugin
  return [cjs(), ts(typescript)];
}
```

#### react.config.js

```js
import {
  getPackageJson,
  resolvePackagePath,
  getBaseRollupPlugins
} from './utils';
// 拿到packages/react包下package.json的name,module
const {
  name,
  module
} = getPackageJson('react');
// react包的路径
const packagePath = resolvePackagePath(name);
// react包产物的路径
const packageDistPath = resolvePackagePath(name, true);
export default [
  // react包
  {
    input: `${packagePath}/${module}`,
    output: {
      file: `${packageDistPath}/index.js`,
      name: 'index.js',
      format: 'umd'
    },
    plugins: getBaseRollupPlugins()
  },
  // jsx-runtime包
  {
    input: `${packagePath}/src/jsx.ts`,
    output: [
      // jsx-runtime
      {
        file: `${packageDistPath}/jsx-runtime.js`,
        name: 'jsx-runtime.js',
        format: 'umd'
      },
      // jsx-dev-runtime
      {
        file: `${packageDistPath}/jsx-dev-runtime.js`,
        name: 'jsx-dev-runtime.js',
        format: 'umd'
      }
    ],
    plugins: getBaseRollupPlugins()
  }
];
```

执行命令

```json
"build:dev": "rimraf dist && rollup --bundleConfigAsCjs --config scripts/rollup/react.config.js"
```

如果没有安装rimraf

```css
npm install -g rimraf
```

生成了3个js文件，但是没有json文件，需要一个rollup插件

```css
pnpm i -D -w rollup-plugin-generate-package-json
```

