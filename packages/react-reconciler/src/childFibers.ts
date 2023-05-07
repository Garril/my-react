import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { ReactElementType } from 'shared/ReactTypes';
import { createFiberFromElement, FiberNode } from './fiber';
import { Placement } from './fiberFlags';
import { HostText } from './workTags';

// shouldTrackEffects: 是否追踪副作用
// （不追踪的话，就不标记那些Placement的flags了）
function ChildReconciler(shouldTrackEffects: boolean) {
  function reconcileSingleElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    element: ReactElementType
  ) {
    // 根据react element创建fiber，然后返回
    const fiber = createFiberFromElement(element);
    fiber.return = returnFiber;
    return fiber;
  }

  function reconcileSingleTextNode(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number
  ) {
    const fiber = new FiberNode(HostText, { content }, null);
    fiber.return = returnFiber;
    return fiber;
  }

  function placeSingleChild(fiber: FiberNode) {
    if (shouldTrackEffects && fiber.alternate === null) {
      fiber.flags |= Placement;
    }
    return fiber;
  }
  /* 
    设计为闭包形式，因为需要根据shouldTrackEffects返回不同reconcileChildFibers的实现
    只有在mount流程，才会存在插入大量dom节点，而在update，只存在局部更新。
  */
  return function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType
  ) {
    /* 
      returnFiber: 父亲fiberNode,
      currentFiber: 当前的子节点的current FiberNode,
      newChild?: 子节点的react Element
    */
    // 判断fiber类型
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFiber, newChild)
          );

        default:
          if (__DEV__) {
            console.warn('未实现的reconcile类型 ', newChild);
          }
          break;
      }
    }
    // TODO 多节点的情况 ul > li * 3
    // HostText
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFiber, newChild)
      );
    }
    if (__DEV__) {
      console.warn('未实现的reconcile类型 ', newChild);
    }
    return null;
  };
}
export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
