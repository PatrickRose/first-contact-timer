import * as t from "io-ts";
import * as types from "./io-ts-def";
import { Either } from "fp-ts/Either";

export type ApiResponse = t.TypeOf<typeof types.ApiResponseDecode>;
export type NewsItem = t.TypeOf<typeof types.NewsItemDecode>;
export type SetBreakingNews = t.TypeOf<typeof types.SetBreakingNewsDecode>;
export type ControlAPI = t.TypeOf<typeof types.ControlAPIDecode>;

export type ControlAction = (game: Game) => Either<string, Partial<Game>>;

export type Defcon = t.TypeOf<typeof types.DefconDecode>;
export type DefconStatus = t.TypeOf<typeof types.DefconStatusDecode>;
export type DefconAPIBody = t.TypeOf<typeof types.DefconAPIBodyDecode>;

export type User = t.TypeOf<typeof types.UserDecode>;

export type LoginFailed = t.TypeOf<typeof types.LoginFailedDecode>;
export type DBUser = t.TypeOf<typeof types.DBUserDecode>;

export type CreateGameResponse = t.TypeOf<
    typeof types.CreateGameResponseDecode
>;
export type GameType = t.TypeOf<typeof types.GameTypeDecode>;

export type Game = t.TypeOf<typeof types.GameDecode>;
export type SetupInformation = t.TypeOf<typeof types.SetupInformationDecode>;
export type DefconComponent = t.TypeOf<typeof types.DefconComponentDecode>;
export type DefconCountry = t.TypeOf<typeof types.DefconCountryDecode>;

export type SetWeatherStatus = t.TypeOf<typeof types.SetWeatherStatusDecode>;
export type WolfAttack = t.TypeOf<typeof types.WolfAttackDecode>;
export type SetWolfAttack = t.TypeOf<typeof types.SetWolfAttackDecode>;
export type LivePress = Exclude<SetupInformation["press"], false>;

export type RunningHotCorps = t.TypeOf<typeof types.RunningHotCorpsDecode>;
export type RunningHotRunners = t.TypeOf<typeof types.RunningHotRunnersDecode>;
export type GangNames = t.TypeOf<typeof types.GangNamesDecode>;

export type SetSharePrice = t.TypeOf<typeof types.SetSharePriceDecode>;
export type SetRunnerRep = t.TypeOf<typeof types.SetRunnerRepDecode>;

export type Trackers = t.TypeOf<typeof types.TrackersDecode>;
export type SetTracker = t.TypeOf<typeof types.SetTrackerDecode>;
export type AddTracker = t.TypeOf<typeof types.AddTrackerDecode>;
export type DeleteTracker = t.TypeOf<typeof types.DeleteTrackerDecode>;
