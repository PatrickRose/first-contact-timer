// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type {NextApiRequest, NextApiResponse} from 'next'
import {ControlAPI, Turn} from "../../types/types";
import MongoRepo from "../../server/connect";
import {toApiResponse} from "../../server/turn";
import {ControlAPIDecode} from "../../types/io-ts-def";

const actions: { [key in ControlAPI["action"]]: (mongo: MongoRepo) => Promise<Turn> } = {
    pause: mongo => mongo.pauseResume(false),
    play: mongo => mongo.pauseResume(true),
    "back-phase": mongo => mongo.backPhase(),
    "back-turn": mongo => mongo.backTurn(),
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method?.toUpperCase() !== 'POST') {
        res.status(404).json({});
        return;
    }

    const mongo = MongoRepo.MakeInstance();

    const body = req.body

    if (!ControlAPIDecode.is(body)) {
        res.status(400).json({success: false});
        return;
    }

    const functionToRun = actions[body.action];

    const nextTurn = await functionToRun(mongo);

    res.status(200).json(toApiResponse(nextTurn));
}
