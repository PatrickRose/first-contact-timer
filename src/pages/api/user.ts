// TODO Update to use App API routing
// We can't do this until IronSession is updated to handle that

import { sessionOptions, SessionType } from "@fc/lib/session";
import { NextApiRequest, NextApiResponse } from "next";
import { User } from "@fc/types/types";
import { getIronSession } from "iron-session";

export default async function userRoute(
    req: NextApiRequest,
    res: NextApiResponse<User>,
) {
    const session = await getIronSession<SessionType>(req, res, sessionOptions);

    if (session.user) {
        res.json({
            ...session.user,
            isLoggedIn: true,
        });
    } else {
        res.json({
            isLoggedIn: false,
            login: "",
            passwordNeedsReset: false,
        });
    }
}
