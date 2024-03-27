import React, { JSX } from "react";
type Args = {
    ref: React.MutableRefObject<JSX.IntrinsicElements["cometchat-checkbox"]>;
    onChangePropRef: React.MutableRefObject<((customEvent: CustomEvent<{
        checked: boolean;
    }>) => void) | undefined>;
};
export declare function Hooks(args: Args): void;
export {};
