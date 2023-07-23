import * as t from "io-ts";

export let SetWeatherStatusDecode = t.type({
    newWeatherMessage: t.string,
});

export const NewsItemDecode = t.type({
    newsText: t.string,
    date: t.string,
    turn: t.number,
    phase: t.number,
});

export const DefconStatusDecode = t.union([
    t.literal("hidden"),
    t.literal(3),
    t.literal(2),
    t.literal(1),
]);

export const DefconDecode = t.type({
    China: DefconStatusDecode,
    France: DefconStatusDecode,
    Russia: DefconStatusDecode,
    UnitedStates: DefconStatusDecode,
    UnitedKingdom: DefconStatusDecode,
    Pakistan: DefconStatusDecode,
    India: DefconStatusDecode,
    Israel: DefconStatusDecode,
});

export const SetBreakingNewsDecode = t.type({
    breakingNews: t.string,
});

export const ControlAPIDecode = t.type({
    action: t.union([
        t.literal("pause"),
        t.literal("play"),
        t.literal("back-turn"),
        t.literal("back-phase"),
        t.literal("forward-phase"),
        t.literal("forward-turn"),
    ]),
});

export const DefconAPIBodyDecode = t.type({
    stateName: t.string,
    newStatus: DefconStatusDecode,
});

export const UserDecode = t.type({
    isLoggedIn: t.boolean,
    login: t.string,
    passwordNeedsReset: t.boolean,
});

export const LoginFailedDecode = t.type({
    message: t.string,
});

export const DBUserDecode = t.type({
    _id: t.string,
    password: t.string,
    passwordNeedsReset: t.boolean,
});

export const LoginFormValuesDecode = t.type({
    username: t.string,
    password: t.string,
});

export const GameTypeDecode = t.union([
    t.literal("first-contact"),
    t.literal("aftermath"),
    t.literal("wts-1970"),
]);

export const CreateGameRequestDecode = t.type({
    gameID: t.string,
    type: GameTypeDecode,
});

export const CreateGameResponseDecode = t.union([
    t.type({
        result: t.literal(true),
    }),
    t.type({
        result: t.literal(false),
        errors: t.array(t.string),
    }),
]);

export const ThemeDecode = t.union([
    t.literal("first-contact"),
    t.literal("aftermath"),
]);

export const DefconCountryDecode = t.type({
    shortName: t.string,
    countryName: t.string,
    status: DefconStatusDecode,
});
export const DefconComponentDecode = t.type({
    componentType: t.literal("Defcon"),
    countries: t.record(t.string, DefconCountryDecode),
});

export const WeatherStatusDecode = t.type({
    componentType: t.literal("Weather"),
    weatherMessage: t.string,
});

export const ComponentDecode = t.union([
    DefconComponentDecode,
    WeatherStatusDecode,
]);

export const SetupInformationDecode = t.intersection([
    t.type({
        phases: t.array(
            t.intersection([
                t.type({
                    title: t.string,
                    length: t.number,
                    hidden: t.boolean,
                }),
                t.partial({
                    extraTime: t.record(t.number, t.number),
                }),
            ])
        ),
        theme: ThemeDecode,
        breakingNewsBanner: t.boolean,
        components: t.array(t.union([t.literal("Defcon"), t.literal("Weather")])),
        gameName: t.string,
    }),
    t.partial({
        logo: t.string
    })
]);

export const TurnInformationDecode = t.type({
    turnNumber: t.number,
    currentPhase: t.number,
    phaseEnd: t.string,
});

export const ApiResponseDecode = t.type({
    turnNumber: t.number,
    phase: t.number,
    breakingNews: t.array(NewsItemDecode),
    active: t.boolean,
    phaseEnd: t.number,
    components: t.array(ComponentDecode),
});
export const GameDecode = t.intersection([
    t.type({
        _id: t.string,
        setupInformation: SetupInformationDecode,
        turnInformation: TurnInformationDecode,
        breakingNews: t.array(NewsItemDecode),
        components: t.array(ComponentDecode),
    }),
    t.union([
        t.type({active: t.literal(true)}),
        t.type({
            active: t.literal(false),
            frozenTurn: ApiResponseDecode,
        }),
    ]),
]);
