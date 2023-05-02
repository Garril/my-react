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



