import { useState, useRef } from "react";
import { requiresSecureMediaAccess, resolveSecureUrl } from "../../../utils/useSecureMedia";

export const useCometChatImageBubble = ({
    src = "",
    placeholderImage = "",
}) => {
    const [image, setImage] = useState<string>(placeholderImage);
    const cancelledRef = useRef(false);

    const updateImage: () => void = () => {
        cancelledRef.current = false;

        if (!src) {
            setImage(placeholderImage);
            return;
        }

        if (requiresSecureMediaAccess(src)) {
            resolveSecureUrl(src)
                .then((signedUrl: string) => {
                    if (!cancelledRef.current) {
                        setImage(signedUrl || placeholderImage);
                    }
                })
                .catch(() => {
                    if (!cancelledRef.current) {
                        setImage(placeholderImage);
                    }
                });
        } else {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                if (!cancelledRef.current) {
                    setImage(img.src);
                }
            };
            img.onerror = () => {
                if (!cancelledRef.current) {
                    setImage(placeholderImage);
                }
            };
        }
    };

    const cleanup = () => {
        cancelledRef.current = true;
    };

    return {
        image,
        updateImage,
        cleanup,
    };
};
