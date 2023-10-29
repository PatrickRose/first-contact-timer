import * as React from "react";
import Image from "next/image";
import AlertIcon from "@fc/public/aftermath-alert.svg";

export default function WeatherStatus({ message }: { message: string }) {
    let textClass = "text-center uppercase text-2xl font-semibold";

    let iconClass = message.length ? "" : "opacity-30";

    let bgClass = message.length
        ? "border-aftermath-alert bg-aftermath-alert text-aftermath"
        : "border-white";

    return (
        <div>
            <div className="py-4 pb-8 lg:hidden">
                <h3 className="text-2xl mt-2 mb-6 uppercase text-center">
                    Weather Alerts
                </h3>
            </div>
            <div className="flex justify-center lg:justify-end mx-1 px-4 lg:px-0">
                <div
                    className={`w-full w-max-[400px] border-2 ${bgClass} p-8 pt-2 pb-2 max-w-[320px] lg:w-[250px]`}
                >
                    <div
                        className={`text-center text-3xl mt-6 mb-6 w-[100px] h-[100px] mx-auto ${iconClass}`}
                    >
                        <Image
                            className="h-full w-auto float-right"
                            src={AlertIcon}
                            alt=""
                        />
                    </div>
                    <h3 className="text-2xl mt-2 mb-6 uppercase text-center mx-auto hidden">
                        Weather Status
                    </h3>
                    {message.length ? (
                        message.split("\n").map((val, key) => (
                            <p className={`${textClass}`} key={key}>
                                {val}
                            </p>
                        ))
                    ) : (
                        <p className={`${textClass}`}>No weather alerts</p>
                    )}
                </div>
            </div>
        </div>
    );
}
