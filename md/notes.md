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
// 开发者写的jsx
<div id="test">123</div>
// jsx进过babel转换为jsx方法的实行
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

修改上面react包部分

```json
import generatePackageJson from 'rollup-plugin-generate-package-json';
.....
	// react包
  {
    input: `${packagePath}/${module}`,
    output: {
      file: `${packageDistPath}/index.js`,
      name: 'index.js',
      format: 'umd'
    },
    plugins: [...getBaseRollupPlugins(), generatePackageJson({
      inputFolder: packagePath,
      outputFolder: packageDistPath,
      baseContents: ({
        name,
        description,
        version
      }) => ({
        // 我们不希望打包后的package.json和react包中的一样，所以要有选择的生成
        // main字段：输出产物的入口。看上面输出格式umd，支持commonjs所以main字段
        name,
        description,
        version,
        main: "index.js"
      })
    })]
  },
```

### 调试

我们打包后，生成了 `dist/node_module/react/。。。`的3个js文件一个json文件（这些就是我们的react包）

进入dist/node_module/react路径，执行

```css
pnpm link --global
```

执行后，全局node_modules下的react包就指向我们刚刚生成的react包

之后我们通过create-react-app，在项目之外的目录下，创建一个新的demo项目，

```css
npx create-react-app react-demo
cd react-demo
npm start

code .
```

在项目中删除不必要的代码

```jsx
// index.js文件
import React from 'react';

const jsx = <div>hello <span>my-react</span></div>
console.log(React)
console.log(jsx)
```

再执行

```css
pnpm link react --global
```

就能将demo项目中依赖的react，从项目的node_module下的react，变成我们全局node_module下的react

```css
npm start
```

会发现跑起来的程序，输出的是我们定义的React、进过我们转换的jsx，但是jsx的children会发现不对。

原因是我们之前jsx和jsxDEV是一样的，在my-react项目做以下修改：

```ts
// jsx.ts
export const jsxDEV = (type: ElementType, config: any) => {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;
  for (const prop in config) {
    const val = config[prop];
    // key 和 ref要先单独处理
    if (prop === 'key') {
      if (val !== undefined) {
        key = '' + val;
      }
      continue;
    }
    if (prop === 'ref') {
      if (val !== undefined) {
        ref = val;
      }
      continue;
    }
    // props
    // 判断是自己的prop，而不是原型上的
    if ({}.hasOwnProperty.call(config, prop)) {
      props[prop] = val;
    }
  }
  return ReactElement(type, key, ref, props);
};



// react包的index.ts
import { jsxDEV } from './src/jsx';

export default {
  version: '0.0.0',
  createElement: jsxDEV
};
```

修改后要重新打包，然后在demo项目重新start，略为繁琐（后续配置热更新）



## reconciler

reconciler是react核心逻辑所在的模块，中文名叫协调器。

协调（reconcile）就是diff算法的意思

### 驱动

jquery（过程驱动）

通过jquery调用宿主环境API，执行，显示真实ui

前端框架（状态驱动）

开发者描述UI（用jsx和模板语法），编译优化后，再由前端框架的 运行时核心模块（react的核心模块是reconciler、vue的核心模块是renderer），去调用宿主环境API，执行，显示真实ui

对于react来说，他是jsx。不支持模板语法，且没有编译优化。他是一个纯运行时的前端框架

### FiberNode

FiberNode是 vdom在react中的实现

#### 引入

上面我们实现了一个数据结构React Element

```js
const ReactElement = function (
  type: Type,
  key: Key,
  ref: Ref,
  props: Props
): ReactElementType {
  const element = {
    // 判断当前字段是一个ReactElement
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
    __mark: 'garril'
  };
  return element;
};
```

可以看到，他没办法表达两个ReactElement之间的关系

且他字段有限，没办法好好表达状态。

没办法作为reconciler作为我们的操作结构

再者我们了解的节点类型和生成顺序如下：

```css
jsx
React Element
FiberNode
DOM Element
```

先从jsx开始理思路：

```js
// 开发者写的jsx
<div id="test">123</div>
// jsx进过babel转换为jsx方法的实行
import { jsx as _jsx } from "react/jsx-runtime";
/*#__PURE__*/_jsx("div", {
  id: "test",
  children: "123"
});
// 在react17之前，是React.createElement，17之后就是jsx方法的调用
```

我们jsx进过babel转换为jsx方法的执行，执行后返回的是一个ReactElement，但ReactElement和DOM Element之间，就用我们reconciler操作的数据结构，叫FiberNode

#### 创建数据结构

在packages/reconciler/src/fiber.ts中定义

```ts
import { Props, Key, Ref } from 'shared/ReactTypes';
import { WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';

export class FiberNode {
  tag: WorkTag;
  key: Key;
  stateNode: any;
  type: any;
  pendingProps: Props;
  memorizedProps: Props | null;
  ref: Ref;

  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  alternate: FiberNode | null;
  flags: Flags;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    //实例的属性
    this.tag = tag;
    this.key = key;
    // 比如hostComponent是<div>
    this.stateNode = null; // 保存div这个dom
    // 比如 tag=0，是一个FunctionComponent的时候
    this.type = null; // type就是function本身

    // 用于表示节点之间的关系(构成树状结构)
    // 因为把fiberNode单做工作单元，所以是return而不是parent
    this.return = null; // return指向父fiberNode
    this.sibling = null; // 指向右边的兄弟fiberNode
    this.child = null; // 指向子fiberNode
    this.index = 0; // 如果同级下可能有多个fiberNode
    this.ref = null;

    // 作为工作单元
    this.pendingProps = pendingProps; // 工作单元刚开始准备工作时，props是什么
    this.memorizedProps = null; // 工作玩后，props是什么
    // 比如说当前的fiberNode是current，他的alternate就指向workInProgress
    // 如果是workInProgress的fiberNode，他的alternate就指向current
    this.alternate = null;
    // 副作用，就是生成的标记
    this.flags = NoFlags;
  }
}

```

类型如下：

packages/reconciler/src/workTags.ts

```ts
export type WorkTag =
  | typeof FunctionComponent
  | typeof HostRoot
  | typeof HostComponent
  | typeof HostText;
export const FunctionComponent = 0;

export const HostRoot = 3;
export const HostComponent = 5;
export const HostText = 6;

```

packages/reconciler/src/fiberFlags.ts

```ts
export type Flags = number;

export const NoFlags = 0b0000001;
export const Placement = 0b0000010;
export const Update = 0b0000100;
export const ChildDeletion = 0b0001000;
```



### 工作方式

reconciler的工作方式：

对于同一个节点，比较他的ReactElement和fiberNode，根据比较的结果，生成子fiberNode（子fiberNode又会跟它自己对应的ReactElement比较，生成标记，再生成孙fiberNode）。

并根据比较的结果生成不同的标记（插入、删除、移动....）对应不同宿主环境API的执行。

<img src="https://forupload.oss-cn-guangzhou.aliyuncs.com/newImg/image-20230503124758633.png" alt="image-20230503124758633" style="zoom:150%;" />

比如挂载 `<div></div>`

```jsx
// babel转义后
jsx("div")
// 执行后拿到type为div的ReactElement
// ReactElement与fiberNode比较
// 因为没有fiberNode
fiberNode: null
// 比较结果：生成子fiberNode
// 对应一个Placement的标记：插入
Placement
// 插入一个div到dom中，就挂载好了
```

再把`div`更新为`p`

```jsx
// 生成p对应的ReactElement
jsx("p")
// 和对应的fiberNode比较
FiberNode {type: 'div'}
// 生成子fiberNode
// 以及对应标记（先删除之前div，再插入p）
Deletion Placement
```

### 双缓存

当所有的ReactElement比较完成后，就会生成一颗：

fiberNode树，一共会存在两颗

1、与视图中真实UI对应的fiberNode树（树中的每个节点我们称为：current）

2、触发更新后，正在reconciler中计算的fiberNode树（树中的每个节点我们称为：workInProgress。生成完这颗树后，会有很多的标记，就对应去调宿主环境API的执行，渲染真实dom。之后workInProgress就会变成current的fiberNode树。）

### 深度优先遍历

在react中很多都是以 DFS 深度优先遍历（而不是BFS广度优先遍历的方式进行的。）

如果有子节点，就遍历子节点

如果没有子节点，就遍历兄弟节点，完成后再回到父节点

他是分为两个阶段：

递：beginWork

归：completeWork



## 触发更新

常见触发更新的API

```css
ReactDOM.createRoot().render
（老版：ReactDOM.render）
this.setState
useState的dispatch方法
```

我们希望实现一套统一的更新机制，特点：

兼容上述触发更新的方式

方便后续拓展（优先级机制....）

（React18的特性是并发更新，需要从当前的同步更新变并发更新）

### 数据结构Update

公用数据结构添加：

```ts
export type Action<State> = State | ((prevState: State) => State);
```

代表更新的数据结构：Update

```ts
export interface Update<State> {
  action: Action<State>;
}


export const createUpdate = <State>(action: Action<State>): Update<State> => {
  return {
    action
  };
};
```

消费update的数据结构：UpdateQueue

```css
一个UpdateQueue有个shared.pending字段
这个字段就指向update
```

```ts
export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null;
  };
}

export const createUpdateQueue = <Action>() => {
  return {
    shared: {
      pending: null
    }
  } as UpdateQueue<Action>;
};
```

将update插入到updateQueue中的方法

```ts
export const enqueueUpdate = <Action>(
  updateQueue: UpdateQueue<Action>,
  update: Update<Action>
) => {
  updateQueue.shared.pending = update;
};
```

消费update的方法

```ts
export const processUpdateQueue = <State>(
  baseState: State,
  pendingUpdate: Update<State>
): { memorizedState: State } => {
  const result: ReturnType<typeof processUpdateQueue<State>> = {
    memorizedState: baseState
  };
  if (pendingUpdate !== null) {
    const action = pendingUpdate.action;
    if (action instanceof Function) {
      // baseState是1, update是 (x) => 4x  ==> memorizedState为4
      result.memorizedState = action(baseState);
    } else {
      // baseState是1, update是2  ==> memorizedState为2
      result.memorizedState = action;
    }
  }
  return result;
};
```



### 结构流程

我们·执行 

```jsx
ReactDOM.createRoot( rootElement ).render(<App/>)
```

`ReactDOM.createRoot()`这时候创建了统一应用的根节点

`fiberRootNode`，接下来，传入的`rootElement`的`dom`，也有自己对应的`fiber`叫做`hostRootFiber（hostRoot类型的fiber）`

最后执行`render`方法，传入`App`组件，生成`App`对应的`fiberNode`

![image-20230503192229528](https://forupload.oss-cn-guangzhou.aliyuncs.com/newImg/image-20230503192229528.png)

### 调用renderRoot

1、实现mount时调用的api（执行`ReactDOM.createRoot().render时调用API`）

2、将该API接入更新机制中。

问题：

更新可以是任意的组件，而更新流程是从根节点递归的

需要一个统一的根节点保存通用信息



## 更新流程的目的

1、生成`wip fiberNode` 树

2、标记副作用`flags`

更新流程的步骤：

1、递： `beginWork`

2、归： `completeWork`

### beginWork

```html
<A>
  <B/>
</A>
```

当进入A组件的`beginWork`时，通过对比`B current fiberNode  `与 `B reactElement `，生成`B 对应的 `wip fiberNode`。

（`wip：workInProgress`的缩写）

在此过程中，最多会标记2类，与 [结构变化] 相关的flags：

`Placement`

​		插入： a -> ab   移动： abc -> bca

​		（插入：标记 b。移动：标记a。）

`ChildDeletion`

​		 删除：ul>li * 3  -> ul>li * 1

不包含与 [属性变化] 相关的 flag：

​		`Update`：<img title="xxx1"/>  ->  <img title="yyy2"/>  ->  

#### 实现前准备`(__DEV__)`

在实现beginWork之前，先为开发环境，添加 `__DEV__`标识，方便 Dev包打印更多信息：

```css
pnpm i -d -w @rollup/plugin-replace
```

在 `scripts\rollup\utils.js`中添加

```js
import replace from '@rollup/plugin-replace';

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
```

作用是什么？

比如在react-reconciler包中的renderRoot函数中：

```ts
do {
  try {
    workLoop();
    break;
  } catch(e) {
    console.warn('workLoop发生错误',e);
  }
} while(true);
```

我们不希望输出的报错，在生产环境的包出现

```ts
do {
  try {
    workLoop();
    break;
  } catch(e) {
    if(__DEV__) {
      console.warn('workLoop发生错误',e);
    }
  }
} while(true);
```

这样，就只会在开发环境下，打印错误信息。

不过在对应js文件中使用`__DEV__`需要声明

在`react-reconciler`包中`src`下创建`reconciler.d.ts`

`reconciler.d.ts`文件内容：

```ts
declare let __DEV__: boolean;
```



#### updateHostRoot

reconciler包src下，beginWork.ts

```ts
function updateHostRoot(wip: FiberNode) {
  // 1、计算新状态值
  const baseState = wip.memorizedState;
  const updateQueue = wip.updateQueue as UpdateQueue<Element>;
  const pending = updateQueue.shared.pending;
  updateQueue.shared.pending = null;
  const { memorizedState } = processUpdateQueue(baseState, pending!);
  /* 当前 hostRootFiber 最新的状态 */
  wip.memorizedState = memorizedState;
  // 2、创建子fiberNode，即：创建B对应的wip fiberNode
  // （由 B的current FiberNode 和 react Element比对产生）
  // react Element -- wip.memorizedState
  // current FiberNode -- wip.alternate?.child

  const nextChildren = wip.memorizedState;
  reconcileChildren(wip, nextChildren);
  return wip.child;
}
```



#### updateHostComponent

reconciler包src下，beginWork.ts

```ts
function updateHostComponent(wip: FiberNode) {
  /* 
  与updateHostRoot的区别是：
    updateHostComponent中是没办法触发更新的，没有更新的过程
    流程就一步，创建子fiberNode
  例子：
    <div><span/></div>
    span节点对应的react Element在 div对应react Element的children中
    而children又在props中，所以：
  */
  const nextProps = wip.pendingProps;
  const nextChildren = nextProps.children;
  reconcileChildren(wip, nextChildren);
  return wip.child;
}
```



#### updateHostText

```css
HostText没有beginWork工作流程，因为他没有子节点
例子：
	<p>content</p>
	content的文本节点对应的fiberNode，就是HostText类型的fiberNode
```



#### 性能优化

在实现上面的`reconcileChildren`之前，先看看优化

```html
<div>
  <p>p-content</p>
  <span>span-content</span>
</div>
```

理论上，mount流程完毕后，包含的flags：

```css
span-content Placement
span Placement

p-content Placement
p Placement

div Placement
```

需要执行5次，Placement操作。

优化的策略就是：我们先构建好一颗 [离屏`DOM`树] 后(这颗树的根节点就是这里的`div`节点，内部结构已经提前构建好了)，只需要对 `div` 执行 1 次` Placement`的操作，就可以把整颗树插入到DOM中。



#### reconcileChildren

beginWork.ts

```ts
function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
  // 获取父节点的current FiberNode
  const current = wip.alternate;
  // 生成子节点 wip FiberNode
  if (current !== null) {
    // update流程
    wip.child = reconcileChildFibers(wip, current?.child, children);
  } else {
    // mount流程
    wip.child = mountChildFibers(wip, null, children);
  }
}
```

childFibers.ts

```ts
// shouldTrackEffects: 是否追踪副作用
// （不追踪的话，就不标记那些Placement的flags了）
function ChildReconciler(shouldTrackEffects: boolean) {
  /* 
    设计为闭包形式，因为需要根据shouldTrackEffects返回不同reconcileChildFibers的实现
    只有在mount流程，才会存在插入大量dom节点，而在update，只存在局部更新。
  */
  return function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiber: null,
    newChild?: ReactElementType
  ) {
    /* 
      returnFiber: 父亲fiberNode,
      currentFiber: 当前的子节点的current FiberNode,
      newChild?: 子节点的react Element
    */
    // return FiberNode
  };
}
export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
```

到了这一步，理一下，有个问题

我们在`moun`阶段，设置为了`false`，就代表着我们的`fiberNode`不会被打上`flags`，那么第一次更新的那唯一一次`Placement`，怎么来的。

看`workLoop.ts`的函数`prepareFreshStack`

首屏渲染，有一个节点（也就是我们的根节点），同时存在 hostRootFiber 和 workInProgress。

我们挂载的组件树的所有wip fiber都会走mount的逻辑

而对于hostRootFiber，就会去走update的逻辑（在这里被打上flags。执行一次dom插入，完成渲染）

