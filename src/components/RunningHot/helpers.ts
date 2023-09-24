import { GangNames, RunningHotCorps } from "@fc/types/types";
import { ImageProps } from "next/image";
import ANT from "./ANT.png";
import DTC from "./DTC.png";
import MCM from "./MCM.png";
import GenEq from "./GenEq.png";
import Gordon from "./Gordon.png";
import Dancers from "./Dancers.png";
import Facers from "./Facers.png";
import G33ks from "./G33ks.png";
import Gruffsters from "./Gruffsters.png";

export const corpNames: Record<keyof RunningHotCorps["sharePrice"], string> = {
    ANT: "Augmented NucleoTech",
    DTC: "Digital Tactical Control",
    MCM: "McCullough Calibrated Mechanical",
    GenEq: "Genetic Equity",
    Gordon: "Gordon",
};
export const corpImages: Record<
    keyof RunningHotCorps["sharePrice"],
    ImageProps["src"]
> = {
    ANT,
    DTC,
    MCM,
    GenEq,
    Gordon,
};

export const gangNames: Record<GangNames, string> = {
    Dancers: "The Dancers",
    Facers: "The Facers",
    G33ks: "The G33ks",
    Gruffsters: "The Gruffsters",
};
export const gangImages: Record<GangNames, ImageProps["src"]> = {
    Dancers,
    Facers,
    G33ks,
    Gruffsters,
};

export const ALL_GANGS: GangNames[] = [
    "Dancers",
    "Facers",
    "G33ks",
    "Gruffsters",
];
