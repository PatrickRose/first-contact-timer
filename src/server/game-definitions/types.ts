import { Game } from "@fc/types/types";

/**
 * The data required to create a new game of a given type.
 *
 * A game definition is pure data: the initial setup information and the
 * starting components. The create route turns this into a persisted {@link Game}.
 */
export type GameDefinition = {
    setupInformation: Game["setupInformation"];
    components: Game["components"];
};
