// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type {NextApiRequest, NextApiResponse} from 'next'
import {ApiResponse} from "../../types/types";
import MongoRepo from "../../server/connect";
import {hasFinished, toApiResponse} from "../../server/turn";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    const mongo = MongoRepo.MakeInstance();

    let turn = await mongo.getCurrentTurn();

    if (hasFinished(turn)) {
        turn = await mongo.nextTurn(turn)
    }

    // if (turn.frozenTurn) {
    //     turn.frozenTurn.phase = 2;
    // }

    res.status(200).json(toApiResponse(turn));
}
