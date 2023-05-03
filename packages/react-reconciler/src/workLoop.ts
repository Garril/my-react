import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { HostRoot } from './workTags';

// 一个全局指针指向当前工作的那个fiberNode
let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
  // 根据我们的fiberRootNode.current也就是hostRootFiber
  // 生成hostRootFiber对应的workInProgress的hostRootFiber
  workInProgress = createWorkInProgress(root.current, {});
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
function performUnitOfWork(fiber: FiberNode) {
  // 递归的递阶段
  // next可能是子fiberNode，也可能是null
  const next = beginWork(fiber);
  fiber.memorizedProps = fiber.pendingProps;
  if (next === null) {
    // 没有子节点，遍历兄弟节点
    completeUnitOfWork(fiber);
  } else {
    workInProgress = next;
  }
}

function completeUnitOfWork(fiber: FiberNode) {
  let node: FiberNode | null = fiber;
  do {
    // 递归的归阶段
    completeWork(node);
    const sibling = node.sibling;
    if (sibling !== null) {
      workInProgress = sibling;
      return;
    }
    node = node.return;
    workInProgress = node;
  } while (node !== null);
}

function renderRoot(root: FiberRootNode) {
  // 初始化
  prepareFreshStack(root);
  do {
    try {
      // 更新流程（递归）
      workLoop();
      break;
    } catch (e) {
      console.warn('renderRoot--error: ', e);
      workInProgress = null;
    }
  } while (true);
}

// 在fiber中调度update
export function scheduleUpdateOnFiber(fiber: FiberNode) {
  // 调度功能

  // 从当前更新的fiber一直向上遍历到我们的fiberRoot
  // fiberRootNode
  const root = markUpdateFromFiberToRoot(fiber);
  renderRoot(root);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node = fiber;
  let parent = node.return;
  while (parent !== null) {
    // return指向父亲，而不是stateNode指向父亲
    // 是一个普通的fiberNode
    node = parent;
    parent = node.return;
  }
  if (node.tag === HostRoot) {
    return node.stateNode;
  }
  return null;
}
