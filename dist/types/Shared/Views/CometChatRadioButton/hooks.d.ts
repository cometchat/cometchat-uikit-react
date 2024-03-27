import React, { JSX } from "react";
type Args = {
    ref: React.MutableRefObject<JSX.IntrinsicElements["cometchat-radio-button"]>;
    onChangePropRef: React.MutableRefObject<((customEvent: CustomEvent<{
        checked: true;
    }>) => void) | undefined>;
};
export declare function Hooks(args: Args): void;
export {};
