import { RunningHotCorps } from "../../types/types";
import { ImageProps } from "next/image";
import ANT from "./ANT.png";
import DTC from "./DTC.png";
import MCM from "./MCM.png";
import GenEq from "./GenEq.png";
import Gordon from "./Gordon.png";

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
