// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type {NextApiRequest, NextApiResponse} from 'next'
import MongoRepo from "../../server/connect";
import {toApiResponse} from "../../server/turn";
import {SetBreakingNewsDecode} from "../../types/io-ts-def";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method?.toUpperCase() !== 'POST') {
        res.status(404).json({});
        return;
    }

    const mongo = MongoRepo.MakeInstance();

    let turn = await mongo.getCurrentTurn();

    const body = req.body;

    if (!SetBreakingNewsDecode.is(body)) {
        res.status(400).json({
            message: 'Turn not active - please wait'
        });

        return;
    }

    if (turn.active) {
        turn = await mongo.setBreakingNews(body.breakingNews);
    }


    res.status(200).json(toApiResponse(turn));
}
