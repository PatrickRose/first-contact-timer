// TODO Update to use App API routing
// We can't do this until IronSession is updated to handle that

import { NextApiRequest, NextApiResponse } from "next";
import { sessionOptions, SessionType } from "@fc/lib/session";
import { User } from "@fc/types/types";
import { getIronSession } from "iron-session";

export default async function logoutRoute(
    req: NextApiRequest,
    res: NextApiResponse<User | { message: string }>,
) {
    if (req.method != "POST") {
        res.status(405).json({
            message: "Only post requests are allowed",
        });
        return;
    }

    const session = await getIronSession<SessionType>(req, res, sessionOptions);
    session.destroy();

    res.status(200).json({
        isLoggedIn: false,
        login: "",
        passwordNeedsReset: false,
    });
}
