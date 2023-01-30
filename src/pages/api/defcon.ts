// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { ApiResponse } from "../../types/types";
import MongoRepo from "../../server/connect";
import { toApiResponse } from "../../server/turn";
import { DefconAPIBodyDecode } from "../../types/io-ts-def";
import { isLeft } from "fp-ts/Either";

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

  if (!DefconAPIBodyDecode.is(body)) {
    res.status(400).json({ success: false, msg: "Incorrect API body" });
    return;
  }

  const nextTurn = await mongo.updateDefconStatus(
    body.stateName,
    body.newStatus
  );

  if (isLeft(nextTurn)) {
    res.status(500).json({
      success: false,
      msg: nextTurn.left,
    });
  } else {
    res.status(200).json(toApiResponse(nextTurn.right));
  }
}
