# React

<hr/>

## 项目结构

### `Multi-repo` 

每个库都有独立的仓库，逻辑清晰，但是如果需要同时开发不同的库，

而他们之间又有相互间的依赖，那么协同管理就会很麻烦

### `Mono-repo`

在一个仓库下，管理很多不同的库

可以很方便的协同管理不同独立的库的生命周期，但是需要一些工具协助管理。

（项目下有很多包：React、react-dom、react-reconciler，要同时管理，**所以选用Mono-repo**）

## 工具

### pnpm

相比yarn和npm，依赖安装快，因为他处理依赖时，不同的依赖是以link的形式连接的

且他更加规范（体现在处理幽灵依赖问题的时候 --> 你没在依赖中显示声明，又被安装了的依赖。）

```css
npm install -g pnpm
pnpm init
```

因为是一个mono-repo，所以需要配置相关文件

### pnpm-workspace.yaml

```yaml
packages:
 - 'packages/*'
```

之后所有的项目都会在根路径的packages的目录下

 ## 开发规范配置

### eslint

```css
pnpm i eslint -D -w
-D: dev dependency
-w: 因为结构是mono-repo，所以安装任何依赖的时候，需要指明
		我的依赖是安装在哪个项目里的，-w指在根目录下安装依赖
```

#### 初始化eslint

```css
npx eslint --init

	to check syntax and find problems 检查语法和发现错误
	ESmodule
	None of framework
	use typescript
	where does your code run？ node
	format config file： json
  install plugin
	pnpm
```

发现报错，因为他给我们安装的时候，没有加 -w，而我们需要

所以copy下来，手动安装下。

比如是：

```css
pnpm i -D -w @typescript-eslint/eslint-plugin@latest, @typescript-eslint/parser@latest
```

发现还是报错，因为pnpm不能解析@符号，而npm、yarn可以。

所以我们把@和后面的都去掉。重新执行。

```css
pnpm i -D -w @typescript-eslint/eslint-plugin, @typescript-eslint/parser
```

#### 安装typescript

又报错，说没找到一些依赖，为什么？

比如我写了一个React组件库，组件库项目是不需要依赖于React的

但使用我组件库的那个项目需要依赖React。

我的组件库项目依赖了React，但是不需要安装React。（这种情况下，React就是我们的peer dependency）要手动装下

```css
pnpm i -D -w typescript
```

安装ts的eslint的插件

```css
pnpm i -D -w @typescript-eslint/eslint-plugin
```



#### .eslintrc.json

生成 `.eslintrc.json`文件

看文件的`parser`，代表我们要用什么样的解析器，把我们的js代码解析成抽象语法树（ast语法树）。默认的解析器没办法解析typescript的代码的，所以需要指定一个社区实现的typescript-eslint-parser

`plugins`是一些typescript规则的合集

但是规则合集中的每一条规则是打开还是关闭，又该怎么指定，看extends，extends是继承其他eslint的配置，决定规则的开关。

```json
{
    "env": {
        "browser": true,
        "es2021": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
        "plugin:prettier/recommended"
    ],
    "overrides": [
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "prettier"
    ],
    "rules": {
      "prettier/prettier": "error",
      "no-case-declarations":"off",
      "no-constant-condition":"off",
      "@typescript-eslint/ban-ts-comment":"off"
    }
}

```



### prettier

eslint是代码规范，prettier是代码风格

```css
pnpm i prettier -D -w
```

#### `.prettier.json`

新建.prettier.json文件。

```json
{
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": true,
  "singleQuote": true,
  "semi": true,
  "trailingComma":"none",
  "bracketSpacing": true
}
```

#### 集成到eslint

为了不和代码规范冲突，需要集成到eslint中

```css
pnpm i eslint-config-prettier eslint-plugin-prettier -D -w
```

对应package.json加脚本命令

```css
"lint": "eslint --ext .js,.ts,.jsx,.tsx --fix ./packages"
```



### husky

用于拦截commit，做一些规范化

安装

```css
pnpm i husky -D -w
```

初始化

```css
npx husky install
```

将刚刚实现的格式化命令 pnpm lint 纳入commit时husky将执行的脚本

```css
npx husky add .husky/pre-commit "pnpm lint"
```

这个时候是对代码做全量检查，当项目复杂后执行速度可能比较慢，可以考虑使用lint-staged。只对暂存区的代码进行检查。这里暂不搞

### commitlint

```css
pnpm i commitlint @commitlint/cli @commitlint/config-conventional -D -w
```

配置 `.commitlintrc.js`

```js
module.exports = {
  extends: ["@commitlint/config-conventional"]
}
```

集成到husky中

```css
npx husky add .husky/commit-msg "npx --no-install commitlint -e $HUSKY_GIT_PARAMS"
```











