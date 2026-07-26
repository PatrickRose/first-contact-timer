"use client";

import { ApiResponse, Game } from "@fc/types/types";
import React, { useEffect, useState } from "react";
import { atTurnLimit, toApiResponse } from "@fc/server/turn";
import useInterval from "@fc/lib/useInterval";
import { ApiResponseDecode } from "@fc/types/io-ts-def";
import ControlTools from "@fc/components/ControlTools";
import PressForm from "./press/PressForm";
import { DEFAULT_THEME, THEME_REGISTRY } from "@fc/components/theme/registry";
import { hardReload } from "@fc/lib/reload";

const triggersAudio: (keyof ApiResponse)[] = ["active", "turnNumber", "phase"];

type GameWrapperProps = {
    game: Game;
} & (
    | {
          mode: "Player" | "Control";
      }
    | {
          mode: "Press";
          pressAccount: number;
      }
);
export default function GameWrapper(props: GameWrapperProps) {
    const { game, mode } = props;
    const [apiResponse, setAPIResponse] = useState<ApiResponse>(
        toApiResponse(game),
    );

    // Everything in `setupInformation` - phase titles and lengths, the theme,
    // press accounts, logos, maxTurns, timerStyles - comes from the `game` prop
    // that was server-rendered once, and polling only ever refreshes
    // `ApiResponse`. So an admin edit cannot reach this screen at all without a
    // full document load. Pin the document version this render was built from; a
    // lazy initialiser keeps it stable instead of drifting with `game`.
    const [renderedAt] = useState<number>(() => game.lastUpdated ?? 0);

    const [audio, setAudio] = useState<HTMLAudioElement>();

    // Intentionally done in an effect so we can force this to happen in the client
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => setAudio(new Audio("/turn-change.mp3")), []);
    const [fetching, setFetching] = useState<boolean>(false);

    // A game that has reached its turn limit never advances again, so its
    // phaseEnd stays at 0. We must not derive the poll interval from that (see
    // below) or every device on the "GAME COMPLETE" screen would poll forever.
    const finished = atTurnLimit(
        apiResponse.turnNumber,
        apiResponse.phase,
        game.setupInformation,
    );

    // A stable per-device jitter factor so devices don't poll in lockstep and
    // stampede the API together (notably at phase boundaries and after the
    // game ends). Kept in state so it doesn't change on every render and reset
    // the interval.
    const [jitterFactor] = useState(() => Math.random());

    // The poll cadence is intentionally decoupled from the live countdown.
    // Previously the delay was `Math.min(phaseEnd * 1000, 5000)`, which meant:
    //   - phaseEnd === 0 (finished game, or transiently at every phase
    //     boundary) collapsed the interval to 100ms — ~10 req/s per device
    //     for the rest of the event.
    //   - the delay changed every second in the final 5s as the local
    //     countdown ticked, resetting useInterval before it could fire, so
    //     clients got no sync in the last 5s and then all stampeded at 0.
    // Instead: poll at a steady rate while active, back off once the game is
    // finished or paused, floor at 1s, and spread devices out with jitter.
    const basePollDelay = finished || !apiResponse.active ? 30000 : 5000;
    const delay = Math.max(
        1000,
        Math.round(basePollDelay * (1 + jitterFactor * 0.25)),
    );

    /**
     * Adopt a server response, unless the game has been edited underneath us - in
     * which case reload instead and report false.
     *
     * Every path that takes a server `ApiResponse` goes through here: the poll,
     * the control buttons, the seven component controls and the press form. Any
     * of them can be the first to see an edit, and funnelling them means the
     * child components need no changes.
     *
     * Strict `>`, never `>=`: after the reload `renderedAt` is re-seeded from the
     * fresh render and equals the served stamp, so the condition goes false.
     * `>=` would reload forever. There is deliberately no "no baseline" guard
     * either - `lastUpdated` is read from the game document rather than the
     * frozen snapshot, so an unedited game reports 0 on both sides consistently,
     * and a guard would suppress the reload for the first edit of every game
     * that predates the field.
     */
    const applyApiResponse = (body: ApiResponse): boolean => {
        if (body.lastUpdated > renderedAt) {
            hardReload();
            return false;
        }

        setAPIResponse(body);
        return true;
    };

    useInterval(() => {
        if (fetching) {
            return;
        }

        setFetching(true);

        fetch(`/game/${game._id}/api`, {
            cache: "no-cache",
            headers: { accept: "application/json" },
        })
            .then((response) => response.json())
            .then((body) => {
                if (ApiResponseDecode.is(body)) {
                    if (!applyApiResponse(body)) {
                        // Reloading. Returning here matters twice over: we must
                        // not touch state we're about to tear down, and we must
                        // not render a fresh `phase` against the stale phase
                        // list, which both themes throw on when the phase is out
                        // of range. It also stops the turn-change chime firing -
                        // an edit response can carry a new turn number, and that
                        // is not a turn change the players should hear.
                        return;
                    }

                    if (
                        triggersAudio.some(
                            (val) => body[val] != apiResponse[val],
                        )
                    ) {
                        audio?.play().catch((e) => console.log(e));
                    }
                } else {
                    throw new Error("Body did not match API");
                }
            })
            .catch((error) => console.error(error))
            .finally(() => setFetching(false));
    }, delay);

    useInterval(() => {
        if (!apiResponse.active) {
            return;
        }

        const phaseEnd = apiResponse.phaseEnd;

        if (phaseEnd == 0) {
            return;
        }

        const newPhaseEnd = Math.max(phaseEnd - 1, 0);
        setAPIResponse({ ...apiResponse, phaseEnd: newPhaseEnd });
    }, 1000);

    let child: React.ReactNode = null;
    let manageTabTitle: string | null = null;

    switch (mode) {
        case "Control":
            child = (
                <ControlTools
                    game={game}
                    apiResponse={apiResponse}
                    setApiResponse={applyApiResponse}
                />
            );
            manageTabTitle = "Control Tools";
            break;
        case "Press":
            child = (
                <PressForm
                    game={game}
                    apiResponse={apiResponse}
                    setApiResponse={applyApiResponse}
                    pressAccount={props.pressAccount}
                />
            );
            manageTabTitle = "Press Tools";
            break;
    }

    // A game whose persisted theme is not in the registry (e.g. a stale or
    // hand-edited DB record) would otherwise resolve to `undefined` and crash
    // the whole page with React's "Element type is invalid". Fall back to the
    // default theme so the game still renders.
    const Theme =
        THEME_REGISTRY[game.setupInformation.theme] ??
        THEME_REGISTRY[DEFAULT_THEME];

    return (
        <Theme
            game={game}
            apiResponse={apiResponse}
            childComponent={child}
            manageTabTitle={manageTabTitle}
        />
    );
}
