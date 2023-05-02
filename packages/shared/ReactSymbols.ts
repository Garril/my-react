// 需要把ReactElement定义为独一无二的值，所以用symbol
// 判断是否支持Symbol
const supportSymbol = typeof Symbol === "function" && Symbol.for;

export const REACT_ELEMENT_TYPE = supportSymbol
  ? Symbol.for("react.element")
  : 0x0001;
