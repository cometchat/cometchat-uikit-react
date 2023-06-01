import { CometChat } from "@cometchat-pro/chat";
import { useCallback, useRef, useState } from "react";

/**
 * Sets the created ref to the `value` passed
 * 
 * @remarks
 * After the initial call of this hook, the internal ref is set to the `value` passed to this hook after the component has rendered completely. 
 * So the returned ref will not have the updated value while the component renders
 */
export function useRefSync<T>(value : T) : React.MutableRefObject<T> {
    const res = useRef(value);
    res.current = value;
    return res;
}

/**
 * Custom hook to make refs stateful
 * 
 * @remarks
 * Making refs stateful opens up the possibility of using the element the ref is pointing to as a dependency for a `useEffect` call
 * 
 * @example
 * Here's a simple example
 * ```ts
 *  // At the top most level of the functional component
 *  const [inputElement, setInputRef] = useStateRef<HTMLInputElement | null>(null);
 *  
 *  // Inside the JSX
 *  <input type = "text" ref = {setInputRef} />
 * ```
 */
export function useStateRef<T>(initialValue : T) : [T, (node : T) => void] {
    const [state, setState] = useState(initialValue);
    const setRef = useCallback((node : T) => {
        setState(node);
    }, []);
    return [state, setRef];
}

export function useCometChatErrorHandler(onError : ((error : CometChat.CometChatException) => void) | undefined) : (error : unknown) => void {
    const onErrorRef = useRefSync(onError);
    const errorHandler = useCallback(function fn(error : unknown) : void {
        if (typeof error === "object" && error) {
            if (error instanceof CometChat.CometChatException) {
                const onError = onErrorRef.current;
                if (onError) {
                    return onError(error);
                }
            }
            else if (error instanceof Error) {
                return fn(new CometChat.CometChatException({
                    code: "ERROR",
                    name: error.name,
                    message: error.message
                }));
            }
        }
        console.log(error);
    }, [onErrorRef]);
    return errorHandler;
}
