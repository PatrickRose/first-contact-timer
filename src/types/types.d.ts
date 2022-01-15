import * as t from 'io-ts';
import {
  ApiResponseDecode, ControlAPIDecode, PhaseDecode, SetBreakingNewsDecode
} from './io-ts-def';

export type ApiResponse = t.TypeOf<typeof ApiResponseDecode>
export type Phase = t.TypeOf<typeof PhaseDecode>
export type SetBreakingNews = t.TypeOf<typeof SetBreakingNewsDecode>
export type ControlAPI = t.TypeOf<typeof ControlAPIDecode>
