import { FiberNode } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';

// 一个全局指针指向当前工作的那个fiberNode
let workInProgress: FiberNode | null = null;

function prepareFreshStack(fiber: FiberNode) {
  workInProgress = fiber;
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
function performUnitOfWork(fiber: FiberNode) {
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

function renderRoot(root: FiberNode) {
  // 初始化
  prepareFreshStack(root);
  do {
    try {
      workLoop();
      break;
    } catch (e) {
      console.warn('renderRoot--error: ', e);
      workInProgress = null;
    }
  } while (true);
}
