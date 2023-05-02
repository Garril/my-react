import {
  getPackageJson,
  resolvePackagePath,
  getBaseRollupPlugins
} from './utils';
// 生成json文件的rollup插件
import generatePackageJson from 'rollup-plugin-generate-package-json';

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