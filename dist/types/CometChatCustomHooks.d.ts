import React from "react";
/**
 * Sets the created ref to the `value` passed
 *
 * @remarks
 * After the initial call of this hook, the internal ref is set to the `value` passed to this hook after the component has rendered completely.
 * So the returned ref will not have the updated value while the component renders
 */
export declare function useRefSync<T>(value: T): React.MutableRefObject<T>;
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
export declare function useStateRef<T>(initialValue: T): [T, (node: T) => void];
export declare function useCometChatErrorHandler(onError?: ((error: CometChat.CometChatException) => void) | null): (error: unknown) => void;
