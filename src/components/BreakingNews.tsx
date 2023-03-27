import * as React from "react";
import { BreakingNews as BreakingNewsType } from "../types/types";
import { useEffect, useRef, useState } from "react";
import { Transition } from "@headlessui/react";

type BreakingNewsProps = {
    content: BreakingNewsType;
};

type ShowHide =
    | {
          state: "show";
          value: string;
      }
    | {
          state: "hide";
          value?: string;
      };

export default function BreakingNews({ content }: BreakingNewsProps) {
    const values = Object.values(content).filter(
        (val) => val !== null
    ) as string[];

    const [activeValue, setActiveValue] = useState<ShowHide>(
        values.length > 0
            ? { state: "show", value: values[0] }
            : { state: "hide" }
    );

    const timer = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (activeValue.state == "hide") {
            if (activeValue.value === undefined && values.length > 0) {
                setActiveValue({
                    state: "show",
                    value: values[0],
                });
            }
        } else {
            // Double check that this value still exists
            const value = activeValue.value;

            if (!values.includes(value)) {
                setActiveValue((activeValue) => {
                    return { ...activeValue, state: "hide" };
                });
            }
        }
    }, [values, activeValue]);

    const getNextBreakingNews = (lastBreakingNews?: string): string | null => {
        const key = values.indexOf(
            lastBreakingNews === undefined ? "" : lastBreakingNews
        );
        const newKey = key === undefined ? 0 : (key + 1) % values.length;

        return values[newKey] ?? undefined;
    };

    const afterEnter = () => {
        if (timer.current) {
            clearTimeout(timer.current);
        }

        timer.current = setTimeout(
            () =>
                setActiveValue((prevState) => {
                    return { ...prevState, state: "hide" };
                }),
            10000
        );
    };

    const afterLeave = () => {
        setActiveValue(({ value }) => {
            const newValue = getNextBreakingNews(value);

            if (typeof newValue != "string") {
                return { state: "hide" };
            }

            return {
                state: "show",
                value: newValue,
            };
        });
    };

    const beforeLeave = () => {
        if (timer.current) {
            clearTimeout(timer.current);
        }
    };

    return (
        <footer className="w-full bg-red-600 text-white mt-4 overflow-hidden hidden lg:flex flex-row justify-between">
            <div className="p-8">
                <Transition show={activeValue.state == "show"} appear={true}>
                    <Transition.Child
                        afterEnter={afterEnter}
                        beforeLeave={beforeLeave}
                        afterLeave={afterLeave}
                        enter="transition-all duration-500 text-left"
                        enterFrom="translate-y-full"
                        enterTo="translate-y-0 text-4xl m-2 font-bold"
                        leave="transition-all delay-200 duration-500 text-left"
                        leaveFrom="translate-y-0 text-4xl font-bold"
                        leaveTo="translate-y-full"
                        entered="text-4xl m-2 font-bold text-left"
                    >
                        <h3 className="uppercase">Breaking news</h3>
                    </Transition.Child>
                    <Transition.Child
                        enter="text-4xl transition ease-in-out delay-500 duration-1000 transform p-4 text-left"
                        enterFrom="translate-x-full"
                        enterTo="translate-x-0"
                        leave="text-4xl transition-transform duration-500 p-4 text-left"
                        leaveFrom="translate-y-0"
                        leaveTo="translate-y-full"
                        entered="p-4 text-4xl text-left"
                    >
                        <div>
                            {activeValue.value
                                ?.replace("\n\n", "\n")
                                .split("\n")
                                .map((val, key) => {
                                    return (
                                        <p className="py-2" key={key}>
                                            {val}
                                        </p>
                                    );
                                })}
                        </div>
                    </Transition.Child>
                </Transition>
            </div>
            <div 
                className="w-64 h-64 p-8"
            >
                <img 
                    className="w-full h-full"
                    src="/GNNLogo.png" 
                />
            </div>
        </footer>
    );
}
