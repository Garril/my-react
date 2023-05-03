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
export const createUpdateQueue = <Action>() => {
  return {
    shared: {
      pending: null
    }
  } as UpdateQueue<Action>;
};

// 将update插入到updateQueue中的方法
export const enqueueUpdate = <Action>(
  updateQueue: UpdateQueue<Action>,
  update: Update<Action>
) => {
  updateQueue.shared.pending = update;
};

// 消费update的方法
export const processUpdateQueue = <State>(
  baseState: State,
  pendingUpdate: Update<State>
): { memorizedState: State } => {
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
