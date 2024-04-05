import * as t from "io-ts";

export const SetWeatherStatusDecode = t.type({
    newWeatherMessage: t.string,
});

export const SetWolfAttackDecode = t.type({
    newStatus: t.boolean,
});

export const NewsItemDecode = t.type({
    newsText: t.string,
    date: t.string,
    turn: t.number,
    phase: t.number,
    pressAccount: t.number,
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
    pressAccount: t.number,
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
    t.literal("dow"),
    t.literal("running-hot"),
    t.literal("AYNOHYEB"),
    t.literal("dev-test-game"),
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

export const WolfAttackDecode = t.type({
    componentType: t.literal("DoWWolfAttack"),
    inProgress: t.boolean,
});

const CorpNamesDecode = t.union([
    t.literal("GenEq"),
    t.literal("MCM"),
    t.literal("Gordon"),
    t.literal("ANT"),
    t.literal("DTC"),
]);

export const RunningHotCorpsDecode = t.type({
    componentType: t.literal("RunningHotCorp"),
    sharePrice: t.record(CorpNamesDecode, t.number),
});

export const TrackersDecode = t.type({
    componentType: t.literal("Trackers"),
    trackers: t.record(
        t.string,
        t.type({
            value: t.number,
            type: t.union([t.literal("bar"), t.literal("circle")]),
            max: t.number,
        }),
    ),
});

export const GangNamesDecode = t.union([
    t.literal("Dancers"),
    t.literal("G33ks"),
    t.literal("Facers"),
    t.literal("Gruffsters"),
]);

export const RunningHotRunnersDecode = t.type({
    componentType: t.literal("RunningHotRunners"),
    rep: t.record(
        t.string,
        t.type({
            reputation: t.number,
            gang: GangNamesDecode,
        }),
    ),
});

export const ComponentDecode = t.union([
    DefconComponentDecode,
    WeatherStatusDecode,
    WolfAttackDecode,
    RunningHotCorpsDecode,
    RunningHotRunnersDecode,
    TrackersDecode,
]);

export const PressDecode = t.intersection([
    t.type({
        name: t.string,
    }),
    t.partial({
        logo: t.string,
    }),
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
            ]),
        ),
        theme: ThemeDecode,
        breakingNewsBanner: t.boolean,
        components: t.array(
            t.union([t.literal("Defcon"), t.literal("Weather")]),
        ),
        gameName: t.string,
    }),
    t.partial({
        logo: t.string,
    }),
    t.partial({
        press: t.union([t.literal(false), t.array(PressDecode), PressDecode]),
        hidePressInSidebar: t.boolean,
    }),
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
        t.type({ active: t.literal(true) }),
        t.type({
            active: t.literal(false),
            frozenTurn: ApiResponseDecode,
        }),
    ]),
]);

export const SetSharePriceDecode = t.type({
    corpName: CorpNamesDecode,
    diff: t.number,
});
export const SetRunnerRepDecode = t.type({
    runnerName: t.string,
    diff: t.number,
});

export const SetTrackerDecode = t.type({
    tracker: t.string,
    value: t.number,
});
