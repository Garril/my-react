export type Flags = number;

export const NoFlags = 0b0000001;
/* 结构变化相关 */
export const Placement = 0b0000010;
export const ChildDeletion = 0b0001000;
/* 属性变化相关 */
export const Update = 0b0000100;
