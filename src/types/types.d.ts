import * as t from 'io-ts';
import * as types from './io-ts-def';

export type ApiResponse = t.TypeOf<typeof types.ApiResponseDecode>
export type Phase = t.TypeOf<typeof types.PhaseDecode>
export type SetBreakingNews = t.TypeOf<typeof types.SetBreakingNewsDecode>
export type ControlAPI = t.TypeOf<typeof types.ControlAPIDecode>

export type Turn = t.TypeOf<typeof types.TurnDecode>
export type BreakingNews = t.TypeOf<typeof types.BreakingNewsDecode>
export type BreakingNewsKey = keyof BreakingNews;
