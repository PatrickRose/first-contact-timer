import { useEffect } from "react";
import { User } from "../types/types";
import useSWR, { SWRResponse } from "swr";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function useUser({
    redirectTo = "",
    redirectIfFound = false,
    forcePasswordChange = true,
} = {}): {
    user: User | undefined;
    mutateUser: SWRResponse<User | undefined, any>["mutate"];
} {
    const { data: user, mutate: mutateUser } = useSWR<User | undefined>(
        "/api/user",
        fetcher,
    );

    const router = useRouter();

    useEffect(() => {
        // if no redirect needed, just return (example: already on /dashboard)
        // if user data not yet there (fetch in progress, logged in or not) then don't do anything yet
        if (!redirectTo || !user) return;

        if (
            // If redirectTo is set, redirect if the user was not found.
            (redirectTo && !redirectIfFound && !user?.isLoggedIn) ||
            // If redirectIfFound is also set, redirect if the user was found
            (redirectIfFound && user?.isLoggedIn)
        ) {
            router.push(redirectTo);
        } else if (
            user?.isLoggedIn &&
            user?.passwordNeedsReset &&
            forcePasswordChange
        ) {
            router.push("/admin/change-password");
        }
    }, [user, redirectIfFound, redirectTo, forcePasswordChange, router]);

    return { user, mutateUser };
}
