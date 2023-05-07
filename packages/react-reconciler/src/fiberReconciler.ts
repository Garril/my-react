import { Container } from 'hostConfig';
import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  UpdateQueue
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';
import { HostRoot } from './workTags';

/* 
  比如：
    ReactDOM.createRoot( rootElement ).render(<App/>)
    在ReactDOM.createRoot(...)方法内部就会执行 createContainer
    在 .render(...)方法内部就会执行 updateContainer
*/
export function createContainer(container: Container) {
  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  const root = new FiberRootNode(container, hostRootFiber);
  hostRootFiber.updateQueue = createUpdateQueue();
  return root;
}

export function updateContainer(
  element: ReactElementType | null,
  root: FiberRootNode
) {
  /* 
    比如 reactDom.createRoot(root).render(<App/>)
    App组件对应的 React Element，就是下面 传入 createUpdate函数的element
    又因为 React Element不是一个function类型，
    在参与计算的时候，看 updateQueue.ts 中的processUpdateQueue函数
    可以知道 processUpdateQueue计算出来的memorizedState，
    其实就是传进来的 React Element
  */
  const hostRootFiber = root.current;
  const update = createUpdate<ReactElementType | null>(element);
  enqueueUpdate(
    hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
    update
  );
  scheduleUpdateOnFiber(hostRootFiber);
  return element;
}
