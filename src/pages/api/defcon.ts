// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { ApiResponse } from "../../types/types";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse | { success: false; msg?: string }>
) {
    res.status(400).json({ success: false, msg: "Defcon is not in this game" });
}
