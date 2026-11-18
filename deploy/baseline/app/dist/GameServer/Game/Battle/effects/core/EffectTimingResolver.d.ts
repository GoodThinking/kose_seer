import { EffectTiming } from './EffectContext';
export declare function ResolveEffectTiming(raw?: string | EffectTiming | null): EffectTiming | null;
export declare function ResolveEffectTimings(rawTimings?: Array<string | EffectTiming> | null): EffectTiming[];
export declare function MatchesEffectTiming(configuredTimings: Array<string | EffectTiming> | undefined, currentTiming: EffectTiming): boolean;
//# sourceMappingURL=EffectTimingResolver.d.ts.map