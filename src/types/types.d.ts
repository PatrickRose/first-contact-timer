import * as t from "io-ts";
import * as types from "./io-ts-def";
import { Either } from "fp-ts/Either";

export type ApiResponse = t.TypeOf<typeof types.ApiResponseDecode>;
export type NewsItem = t.TypeOf<typeof types.NewsItemDecode>;
export type SetBreakingNews = t.TypeOf<typeof types.SetBreakingNewsDecode>;
export type ControlAPI = t.TypeOf<typeof types.ControlAPIDecode>;

export type Turn = t.TypeOf<typeof types.TurnDecode>;
export type BreakingNews = ApiResponse["breakingNews"];

export type ControlAction = (game: Game) => Either<string, Partial<Game>>;

export type Defcon = t.TypeOf<typeof types.DefconDecode>;
export type DefconStatus = t.TypeOf<typeof types.DefconStatusDecode>;
export type DefconAPIBody = t.TypeOf<typeof types.DefconAPIBodyDecode>;

export type ActiveTabs = "home" | "defcon" | "press" | "manage";

export type User = t.TypeOf<typeof types.UserDecode>;

export type LoginFailed = t.TypeOf<typeof types.LoginFailedDecode>;
export type DBUser = t.TypeOf<typeof types.DBUserDecode>;

export type CreateGameRequest = t.TypeOf<typeof types.CreateGameRequestDecode>;
export type CreateGameResponse = t.TypeOf<
    typeof types.CreateGameResponseDecode
>;
export type GameType = t.TypeOf<typeof types.GameTypeDecode>;

export type Game = t.TypeOf<typeof types.GameDecode>;
export type SetupInformation = t.TypeOf<typeof types.SetupInformationDecode>;
export type DefconComponent = t.TypeOf<typeof types.DefconComponentDecode>;
export type DefconCountry = t.TypeOf<typeof types.DefconCountryDecode>;
export type WeatherStatus = t.TypeOf<typeof types.WeatherStatusDecode>;

export type SetWeatherStatus = t.TypeOf<typeof types.SetWeatherStatusDecode>;
