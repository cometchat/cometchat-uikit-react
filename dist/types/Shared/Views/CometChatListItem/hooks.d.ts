import React, { JSX } from "react";
type Args = {
    ref: React.MutableRefObject<JSX.IntrinsicElements["cometchat-list-item"]>;
    onListItemClickPropRef: React.MutableRefObject<((customEvent: CustomEvent<{
        id: string;
    }>) => void) | undefined>;
};
export declare function Hooks(args: Args): void;
export {};
