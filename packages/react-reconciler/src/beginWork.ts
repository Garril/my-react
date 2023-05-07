import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { HostComponent, HostRoot, HostText } from './workTags';
// 递归中的递阶段
export const beginWork = (wip: FiberNode) => {
  // 和ReactElement比较
  switch (wip.tag) {
    case HostRoot:
      return updateHostRoot(wip);
    case HostComponent:
      return updateHostComponent(wip);
    case HostText:
      /* 
        HostText没有beginWork工作流程，因为他没有子节点
        例子：
          <p>content</p>
        content的文本节点对应的fiberNode，就是HostText类型的fiberNode
      */
      return null;
    default:
      if (__DEV__) {
        console.warn('beginWork未实现的类型');
      }
      break;
  }
  // 返回子fiberNode
};

function updateHostRoot(wip: FiberNode) {
  // 1、计算新状态值
  const baseState = wip.memorizedState;
  const updateQueue = wip.updateQueue as UpdateQueue<Element>;
  const pending = updateQueue.shared.pending;
  updateQueue.shared.pending = null;
  const { memorizedState } = processUpdateQueue(baseState, pending);
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
