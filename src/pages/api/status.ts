// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import {ApiResponse} from "../../types/types";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  res.status(200).json({
    turnNumber: 1,
    phase: 1,
    breakingNews: "Here is some breaking news!",
    active: true,
    phaseEnd: 10
  })
}
