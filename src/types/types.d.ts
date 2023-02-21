import * as t from "io-ts";
import * as types from "./io-ts-def";
import { Either } from "fp-ts/Either";

export type ApiResponse = t.TypeOf<typeof types.ApiResponseDecode>;
export type Phase = t.TypeOf<typeof types.PhaseDecode>;
export type NewsItem = t.TypeOf<typeof types.NewsItemDecode>;
export type SetBreakingNews = t.TypeOf<typeof types.SetBreakingNewsDecode>;
export type ControlAPI = t.TypeOf<typeof types.ControlAPIDecode>;

export type Turn = t.TypeOf<typeof types.TurnDecode>;
export type BreakingNews = t.TypeOf<typeof types.BreakingNewsDecode>;
export type BreakingNewsKey = keyof BreakingNews;

export type ControlAction = Promise<Either<string, Turn>>;

export type Defcon = t.TypeOf<typeof types.DefconDecode>;
export type DefconStatus = t.TypeOf<typeof types.DefconStatusDecode>;
export type DefconAPIBody = t.TypeOf<typeof types.DefconAPIBodyDecode>;
