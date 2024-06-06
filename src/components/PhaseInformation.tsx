import { ApiResponse, Game } from "@fc/types/types";
import { getCurrentPhase } from "@fc/server/turn";
import { isLeft } from "fp-ts/Either";

function DisplayPhaseInformation({
    information,
}: {
    information: string | string[];
}) {
    if (typeof information == "string") {
        return <p>{information}</p>;
    }

    return (
        <ul className="list-disc">
            {information.map((val, index) => (
                <li key={index}>{val}</li>
            ))}
        </ul>
    );
}

export default function PhaseInformation({
    game,
    apiResponse,
}: {
    game: Game;
    apiResponse: ApiResponse;
}) {
    const phase = getCurrentPhase(apiResponse.phase, game.setupInformation);

    if (isLeft(phase)) {
        return null;
    }

    const information = phase.right.phaseInformation;

    if (information === undefined) {
        return null;
    }

    return <DisplayPhaseInformation information={information} />;
}
