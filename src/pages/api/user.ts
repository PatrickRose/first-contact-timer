// TODO Update to use App API routing
// We can't do this until IronSession is updated to handle that

import { withIronSessionApiRoute } from "iron-session/next";
import { sessionOptions } from "@fc/lib/session";
import { NextApiRequest, NextApiResponse } from "next";
import { User } from "@fc/types/types";

export default withIronSessionApiRoute(userRoute, sessionOptions);

async function userRoute(req: NextApiRequest, res: NextApiResponse<User>) {
    if (req.session.user) {
        // in a real world application you might read the user id from the session and then do a database request
        // to get more information on the user if needed
        res.json({
            ...req.session.user,
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
