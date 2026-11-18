import { IAtomicEffect, IAtomicEffectParams } from './IAtomicEffect';
/**
 * 原子效果工厂
 * 根据参数创建原子效果实例
 *
 * 使用注册表模式替代 if-else 链：
 * - 新增效果只需在 SPECIAL_REGISTRY 中添加一行
 * - O(1) 查找替代 O(n) 遍历
 */
export declare class AtomicEffectFactory {
    private static instance;
    private constructor();
    static getInstance(): AtomicEffectFactory;
    create(params: IAtomicEffectParams): IAtomicEffect | null;
    createBatch(paramsList: IAtomicEffectParams[]): IAtomicEffect[];
}
export declare const atomicEffectFactory: AtomicEffectFactory;
//# sourceMappingURL=AtomicEffectFactory.d.ts.map