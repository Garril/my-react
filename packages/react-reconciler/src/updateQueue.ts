import { Action } from 'shared/ReactTypes';
import { Update } from './fiberFlags';

/* 
  const updateUser: Update<User> = {
    action: (prevUser) => ({ ...prevUser, name: 'John' }),
  };
*/
// update相关
export interface Update<State> {
  action: Action<State>;
}
export const createUpdate = <State>(action: Action<State>): Update<State> => {
  return {
    action
  };
};

// updateQueue相关
export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null;
  };
}
export const createUpdateQueue = <State>() => {
  // 这个return的结构 （看fiber.ts的createWorkInProgress方法）
  // 可以让 workInProgress的fiber和 current的fiber同用一个updateQueue
  return {
    shared: {
      pending: null
    }
  } as UpdateQueue<State>;
};

// 将update插入到updateQueue中的方法
export const enqueueUpdate = <State>(
  updateQueue: UpdateQueue<State>,
  update: Update<State>
) => {
  updateQueue.shared.pending = update;
};

// 消费update的方法 （计算状态的最新值）
export const processUpdateQueue = <State>(
  // 接受基础的state和参与计算的update
  baseState: State,
  pendingUpdate: Update<State> | null
): { memorizedState: State } => {
  // 返回的对象包裹着的memorizedState就是计算出的新state
  const result: ReturnType<typeof processUpdateQueue<State>> = {
    memorizedState: baseState
  };
  if (pendingUpdate !== null) {
    const action = pendingUpdate.action;
    if (action instanceof Function) {
      // baseState是1, update是 (x) => 4x  ==> memorizedState为4
      result.memorizedState = action(baseState);
    } else {
      // baseState是1, update是2  ==> memorizedState为2
      result.memorizedState = action;
    }
  }
  return result;
};
