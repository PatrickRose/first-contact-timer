// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { ApiResponse, ControlAction, ControlAPI } from "../../types/types";
import MongoRepo from "../../server/connect";
import { toApiResponse } from "../../server/turn";
import { ControlAPIDecode } from "../../types/io-ts-def";
import { isLeft } from "fp-ts/Either";

const actions: {
    [key in ControlAPI["action"]]: (mongo: MongoRepo) => ControlAction;
} = {
    pause: (mongo) => mongo.pauseResume(false),
    play: (mongo) => mongo.pauseResume(true),
    "back-phase": (mongo) => mongo.backPhase(),
    "back-turn": (mongo) => mongo.backTurn(),
    "forward-phase": (mongo) => mongo.forwardPhase(),
    "forward-turn": (mongo) => mongo.forwardTurn(),
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse | { success: false; msg?: string }>
) {
    if (req.method?.toUpperCase() !== "POST") {
        res.status(404).json({ success: false, msg: "Incorrect method" });
        return;
    }

    const mongo = MongoRepo.MakeInstance();

    const body = req.body;

    if (!ControlAPIDecode.is(body)) {
        res.status(400).json({ success: false, msg: "Incorrect API body" });
        return;
    }

    const functionToRun = actions[body.action];

    const nextTurn = await functionToRun(mongo);

    if (isLeft(nextTurn)) {
        res.status(500).json({
            success: false,
            msg: nextTurn.left,
        });
    } else {
        res.status(200).json(toApiResponse(nextTurn.right));
    }
}
