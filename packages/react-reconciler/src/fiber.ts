import { Props, Key, Ref } from 'shared/ReactTypes';
import { WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';

export class FiberNode {
  tag: WorkTag;
  key: Key;
  stateNode: any;
  type: any;
  pendingProps: Props;
  memorizedProps: Props | null;
  ref: Ref;

  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  alternate: FiberNode | null;
  flags: Flags;

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
    // 比如说当前的fiberNode是current，他的alternate就指向workInProgress
    // 如果是workInProgress的fiberNode，他的alternate就指向current
    this.alternate = null;
    // 副作用，就是生成的标记
    this.flags = NoFlags;
  }
}
