import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import { FunctionComponent, HostComponent, WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';

export class FiberNode {
  tag: WorkTag;
  key: Key;
  stateNode: any;
  type: any;
  pendingProps: Props;
  memorizedProps: Props | null;
  memorizedState: any;
  ref: Ref;

  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  alternate: FiberNode | null;
  flags: Flags;

  updateQueue: unknown;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    //实例的属性
    this.tag = tag;
    this.key = key;
    // 比如hostComponent是<div>
    this.stateNode = null; // 保存div这个dom
    // 比如 tag=0，是一个FunctionComponent的时候
    this.type = null; // type就是function本身

    // 用于表示节点之间的关系(构成树状结构)
    // 因为把fiberNode单做工作单元，所以是return而不是parent
    this.return = null; // return指向父fiberNode
    this.sibling = null; // 指向右边的兄弟fiberNode
    this.child = null; // 指向子fiberNode
    this.index = 0; // 如果同级下可能有多个fiberNode
    this.ref = null;

    // 作为工作单元
    this.pendingProps = pendingProps; // 工作单元刚开始准备工作时，props是什么
    this.memorizedProps = null; // 工作玩后，props是什么
    this.memorizedState = null; // 工作玩后，state是什么
    this.updateQueue = null;

    // 比如说当前的fiberNode是current，他的alternate就指向workInProgress
    // 如果是workInProgress的fiberNode，他的alternate就指向current
    this.alternate = null;
    // 副作用，就是生成的标记
    this.flags = NoFlags;
  }
}

export class FiberRootNode {
  /* container保存了宿主环境，挂载的节点
    比如: ReactDOM.createRoot( rootElement ).render(<App/>)
    container:就是保存的rootElement的节点，但是不能直接设置为 DOM-Element
    因为其他宿主环境，可能没有 DOM-Element，所以要抽象一个类型Container
    这里的 Container是import在tsconfig.json的paths配置，不是import相对路径的
    (流程看markdown中的reconciler -- 触发更新 -- 结构流程)
  */
  container: Container;
  current: FiberNode;
  finishedWork: FiberNode | null;
  constructor(container: Container, hostRootFiber: FiberNode) {
    this.container = container;
    this.current = hostRootFiber;
    hostRootFiber.stateNode = this;
    this.finishedWork = null;
  }
}
// FiberRootNode创建workInProgress
export const createWorkInProgress = (
  current: FiberNode,
  pendingProps: Props
): FiberNode => {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    // 首屏渲染，workInProgress是null
    // mount
    workInProgress = new FiberNode(current.tag, pendingProps, current.key);
    workInProgress.stateNode = current.stateNode;

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // update
    workInProgress.pendingProps = pendingProps;
    // 清除副作用
    workInProgress.flags = NoFlags;
  }
  workInProgress.type = current.type;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.child = current.child;
  workInProgress.memorizedProps = current.memorizedProps;
  workInProgress.memorizedState = current.memorizedState;

  return workInProgress;
};

export function createFiberFromElement(element: ReactElementType): FiberNode {
  const { type, key, props } = element;
  let fiberTag: WorkTag = FunctionComponent;

  if (typeof type === 'string') {
    // 比如：一个<div />，他的type就是一个string类型的'div'
    fiberTag = HostComponent;
  } else if (typeof type !== 'function' && __DEV__) {
    console.warn('未定义的type类型 ', element);
  }
  const fiber = new FiberNode(fiberTag, props, key);
  fiber.type = type;
  return fiber;
}
