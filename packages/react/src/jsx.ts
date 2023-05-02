import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import {
  Type,
  Key,
  Ref,
  Props,
  ReactElementType,
  ElementType
} from "shared/ReactTypes";
// ReactElement构造函数
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
    __mark: "garril"
  };
  return element;
};
// jsx方法
/* 
  import { jsx as _jsx } from "react/jsx-runtime";
  _jsx("div", {
    id: "test",
    children: "123"
  });
*/
export const jsx = (type: ElementType, config: any, ...maybeChildren: any) => {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;
  for (const prop in config) {
    const val = config[prop];
    // key 和 ref要先单独处理
    if (prop === "key") {
      if (val !== undefined) {
        key = "" + val;
      }
      continue;
    }
    if (prop === "ref") {
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
  // 处理maybeChildren
  const maybeChildrenLength = maybeChildren.length;
  if (maybeChildrenLength) {
    // 长度为一，帮他直接铺开
    if (maybeChildrenLength === 1) {
      props.children = maybeChildren[0];
    } else {
      props.children = maybeChildren;
    }
  }
  return ReactElement(type, key, ref, props);
};
// 实际上生产环境（jsx） 和 开发环境（jsxDEV）是不同的实现
// 开发多了很多额外的检查
export const jsxDEV = jsx;
