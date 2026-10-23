import * as t from "io-ts";
import { GAME_DEFINITIONS } from "@fc/server/game-definitions";

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

// Derived from the game definition keys so the type list and the data cannot
// diverge. Adding a game to `GAME_DEFINITIONS` extends this decoder for free.
export const GameTypeDecode = t.keyof(GAME_DEFINITIONS);

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

export const WolfAttackDecode = t.intersection([
    t.type({
        componentType: t.literal("DoWWolfAttack"),
        inProgress: t.boolean,
    }),
    t.partial({
        alert: t.type({
            text: t.string,
            label: t.string,
            emoji: t.string,
        }),
    }),
]);

export const CorpNamesDecode = t.union([
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

export const LightLevelDecode = t.type({
    componentType: t.literal("LightLevel"),
    value: t.number,
    max: t.number,
});

export const SetLightLevelDecode = t.type({
    value: t.number,
});

export const TrackerDecode = t.type({
    value: t.number,
    type: t.union([t.literal("bar"), t.literal("circle")]),
    max: t.number,
});
export const TrackersDecode = t.type({
    componentType: t.literal("Trackers"),
    trackers: t.record(t.string, TrackerDecode),
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
    LightLevelDecode,
]);

export const PressDecode = t.intersection([
    t.type({
        name: t.string,
    }),
    t.partial({
        logo: t.string,
    }),
]);

export const SetupInformationPhaseDecode = t.intersection([
    t.type({
        title: t.string,
        length: t.number,
        hidden: t.boolean,
    }),
    t.partial({
        extraTime: t.record(t.number, t.number),
    }),
    t.partial({
        logo: t.string,
    }),
    t.partial({
        phaseInformation: t.union([t.string, t.array(t.string)]),
    }),
]);

const PhaseStyleDecode = t.type({
    background: t.string,
    text: t.string,
    border: t.string,
});
export const SetupInformationDecode = t.intersection([
    t.type({
        phases: t.array(SetupInformationPhaseDecode),
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
    t.partial({
        maxTurns: t.number,
    }),
    t.partial({
        timerStyles: t.type({
            activePhase: PhaseStyleDecode,
            futurePhase: PhaseStyleDecode,
            pastPhase: PhaseStyleDecode,
        }),
    }),
]);

export const TurnInformationDecode = t.type({
    turnNumber: t.number,
    currentPhase: t.number,
    phaseEnd: t.string,
});

/**
 * The rendered state of a game at a point in time.
 *
 * This is also the *persisted* shape of a paused game's `frozenTurn`, so it must
 * contain only fields that are meaningful to freeze. Anything that is a property
 * of the game document rather than of the snapshot belongs on
 * {@link ApiResponseDecode} instead, or it would go stale the moment the game
 * changed underneath a paused snapshot.
 */
export const FrozenTurnDecode = t.type({
    turnNumber: t.number,
    phase: t.number,
    breakingNews: t.array(NewsItemDecode),
    active: t.boolean,
    phaseEnd: t.number,
    components: t.array(ComponentDecode),
});

/**
 * The poll response: a frozen turn plus the game-document-level fields clients
 * need. `lastUpdated` is always overlaid from the game by `toApiResponse`, never
 * read out of a stored snapshot - see the docblock there.
 */
export const ApiResponseDecode = t.intersection([
    FrozenTurnDecode,
    t.type({
        lastUpdated: t.number,
    }),
]);

export const GameDecode = t.intersection([
    t.type({
        _id: t.string,
        setupInformation: SetupInformationDecode,
        turnInformation: TurnInformationDecode,
        breakingNews: t.array(NewsItemDecode),
        components: t.array(ComponentDecode),
    }),
    t.partial({
        // Epoch milliseconds, bumped only when a game's *structure*
        // (setupInformation / components) is edited - never by a turn tick, a
        // control action or a press post. Clients compare it against the stamp
        // their page was server-rendered from and hard-reload when it moves,
        // which is the only way an edit reaches an already-open screen.
        //
        // Optional because stored games are cast rather than decoded (see
        // `MongoRepository.get`), so making it required would be a type-level
        // lie for every document written before editing existed. Readers go
        // through `?? 0`; 0 is lower than any real stamp, so an unedited game
        // never triggers a reload.
        lastUpdated: t.number,
    }),
    t.union([
        t.type({ active: t.literal(true) }),
        t.type({
            active: t.literal(false),
            frozenTurn: FrozenTurnDecode,
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
export const AddTrackerDecode = t.type({
    tracker: t.string,
    trackerDefinition: TrackerDecode,
});
export const DeleteTrackerDecode = t.type({
    tracker: t.string,
    action: t.literal("delete"),
});
