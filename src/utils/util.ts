import { useCallback, useEffect, useRef } from "react";
import WaveSurfer from "../components/BaseComponents/CometChatAudioBubble/src/wavesurfer";
import { CalendarObject } from "./CalendarObject";
import { CometChatUIKitLoginListener } from "../CometChatUIKit/CometChatUIKitLoginListener";
import { CometChatUIKitConstants } from "../constants/CometChatUIKitConstants";
import { CometChatUIKitUtility } from "../CometChatUIKit/CometChatUIKitUtility";
import { CometChatTextFormatter } from "../formatters";

interface MediaPlayer {
video?:HTMLVideoElement | null,
mediaRecorder?:MediaRecorder | null
}
/**
 * storing current media which is being played.
 */
export const currentMediaPlayer:MediaPlayer = {
  video:null,
  mediaRecorder:null
}
export const  currentAudioPlayer: {
  instance: WaveSurfer | null;
  setIsPlaying: ((isPlaying: boolean) => void) | null;
} = { instance: null, setIsPlaying: null };

/**
 * Function to stop current media playback.
 */

export function closeCurrentMediaPlayer(pauseAudio: boolean = true) {
  if (pauseAudio && currentAudioPlayer.instance && currentAudioPlayer.setIsPlaying) {
    currentAudioPlayer.instance.pause();
    if (currentAudioPlayer.setIsPlaying) {
      currentAudioPlayer.setIsPlaying(false);
    }
  }

  if (currentMediaPlayer.video && !currentMediaPlayer.video.paused) {
    currentMediaPlayer.video.pause();
  }
  if (currentMediaPlayer.mediaRecorder) {
    currentMediaPlayer.mediaRecorder.stop();
  }
}

export function isMessageSentByMe(message: CometChat.BaseMessage, loggedInUser: CometChat.User) {
    return (
        !message.getSender() ||
        loggedInUser?.getUid() === message.getSender().getUid()
    );
}
/**
 * Function to check if the current browser is safari.
 * @returns boolean
 */
export function isSafari():boolean {
  const userAgent = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(userAgent);
}

/**
 * Checks if a given text is a URL.
 * A valid URL should start with either "http", "https", or "www" and must not contain spaces.
 *
 * @param {string} text - The text to be checked.
 * @returns {boolean} Returns true if the text is a URL, false otherwise.
 */
export function isURL(text: string): boolean {
    const urlPattern = /^(https?:\/\/|www\.)[^\s]+$/i; // Regex to match http, https, www URLs
    return urlPattern.test(text);
}


export function getThemeVariable(name: string) {
    const root = document.documentElement;
    return getComputedStyle(root).getPropertyValue(name).trim();
}

export function getThemeMode(){
    const isDarkMode = document.querySelector('[data-theme="dark"]') ? true : false;
   return isDarkMode ? "dark" : "light";
}
/**
 * Function to convert audio forat from webm to wav
 * @param file 
 * @returns 
 */
export async function processFileForAudio(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = async () => {
        try {
          if (reader.result) {
            // Decode the webm file
            const audioContext = new AudioContext();
            const arrayBuffer = reader.result as ArrayBuffer;
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
            // Convert to WAV format
            const wavBlob = exportToWav(audioBuffer);
  
            // Create a new File object with WAV content
            const wavFile = new File([wavBlob], file.name.replace(".webm", ".wav"), {
              type: "audio/wav",
            });
  
            resolve(wavFile);
          }
        } catch (error) {
          reject(new Error(`Error converting file: ${error}`));
        }
      };
  
      reader.onerror = () =>
        reject(
          new Error(`Converting the file named "${file.name}" to binary failed`)
        );
  
      reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
    });
  }
  
  // Helper function to export AudioBuffer to WAV format
  function exportToWav(audioBuffer: AudioBuffer): Blob {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numChannels * 2 + 44; // Add WAV header size
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
  
    // Write WAV header
    writeWavHeader(view, audioBuffer);
  
    // Write PCM data
    let offset = 44;
    const channelData: Float32Array[] = [];
    for (let channel = 0; channel < numChannels; channel++) {
      channelData[channel] = audioBuffer.getChannelData(channel);
    }
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i])); // Clamp values
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true); // Write PCM sample
        offset += 2;
      }
    }
  
    return new Blob([buffer], { type: "audio/wav" });
  }
  
  // Function to write WAV header
  function writeWavHeader(view: DataView, audioBuffer: AudioBuffer): void {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numChannels * 2 + 44;
  
    // "RIFF" chunk descriptor
    writeString(view, 0, "RIFF");
    view.setUint32(4, length - 8, true);
    writeString(view, 8, "WAVE");
  
    // "fmt " sub-chunk
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // Sub-chunk size
    view.setUint16(20, 1, true); // Audio format (1 = PCM)
    view.setUint16(22, numChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * numChannels * 2, true); // Byte rate
    view.setUint16(32, numChannels * 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
  
    // "data" sub-chunk
    writeString(view, 36, "data");
    view.setUint32(40, length - 44, true);
  }
  
  // Helper to write a string into the DataView
  function writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

/**
 * Converts a Unix timestamp to a formatted date string in DD/MM/YYYY format.
 *
 * @param {number} timestamp - The Unix timestamp (in seconds) to be converted.
 * @returns {string} The formatted date string in DD/MM/YYYY format.
 */
export function formatDateFromTimestamp(timestamp:number) {
    const date = new Date(timestamp * 1000); // Convert to milliseconds
    const day = date.getDate();
    const month = date.getMonth() + 1; // getMonth() is zero-based
    const year = date.getFullYear();
  
    // Format as DD/MM/YYYY
    return `${day}/${month}/${year}`;
  }

  export function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
  }


  export function sanitizeCalendarObject(calendarObject?:CalendarObject){
    if(calendarObject && Object.keys(calendarObject).length > 0){
      return Object.fromEntries(
          Object.entries(calendarObject).filter(([_, value]) => value !== undefined)
      );
    }
    else return {}
  }

  export function fireClickEvent(){
    if(window)
     window.dispatchEvent(new CustomEvent('overlayclick'));
}

export const decodeHTML = (input: string): string =>  {
  const txt = document.createElement("textarea");
  txt.innerHTML = input;
  return txt.value;
}

const getAttr = (tag: string, name: string): string | null => {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = re.exec(tag);
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : null;
};
const getDataAttrs = (tag: string): Array<[string, string]> => {
  const out: Array<[string, string]> = [];
  const re = /\b(data-[\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) out.push([m[1], m[2] ?? m[3] ?? m[4] ?? ""]);
  return out;
};

// span tags, any other tag, and raw text
const TOKENS = /<\/?span\b[^>]*>|<[^>]+>|[^<]+/gi;

export const sanitizeHtmlStringToFragment = (html: string, textFormatterArray?: CometChatTextFormatter[]): DocumentFragment => {
  const frag = document.createDocumentFragment();
  const stack: HTMLElement[] = [];

  const append = (n: Node) => {
    (stack[stack.length - 1] ?? frag).appendChild(n);
  };

  let m: RegExpExecArray | null;
  while ((m = TOKENS.exec(html))) {
    const tok = m[0];

    // opening <span ...>
    if (/^<span\b/i.test(tok)) {
      const cls = (getAttr(tok, "class") || "").trim();
      if (cls) {
        const el = document.createElement("span");
        el.className = cls;

        const ce = getAttr(tok, "contenteditable");
        if (ce !== null) el.setAttribute("contenteditable", ce);
        for (const [k, v] of getDataAttrs(tok)) el.setAttribute(k, v);

        append(el);
        stack.push(el);
      } else {
        // span with NO class → literal
        append(document.createTextNode(tok));
      }
      continue;
    }

    // closing </span>
    if (/^<\/span\b/i.test(tok)) {
      if (stack.length) {
        stack.pop();
      } else {
        // stray close → literal
        append(document.createTextNode(tok));
      }
      continue;
    }

    // any other tag → literal
    if (tok.startsWith("<")) {
      append(document.createTextNode(tok));
      continue;
    }

    // plain text
    append(document.createTextNode(tok));
  }

  // Optional: register listeners on the spans we actually created
  if (textFormatterArray?.length) {
    const walk = (n: Node) => {
      if (n instanceof HTMLElement && n.tagName.toLowerCase() === "span" && n.classList.length > 0) {
        for (let i = 0; i < textFormatterArray.length; i++) {
          textFormatterArray[i].registerEventListeners(n, n.classList);
        }
      }
      n.childNodes.forEach(walk);
    };
    walk(frag);
  }

  return frag;
};

/** 
* Custom React hook for creating debounced callbacks with automatic cleanup.
*/
export const useDebouncedCallback = (callback: () => void, delay: number) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
    const debouncedCallback = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback();
        timeoutRef.current = null;
      }, delay);
    }, [callback, delay]);
  
    const cleanup = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, []);
  
    useEffect(() => {
      return cleanup;
    }, [cleanup]);
  
    return { debouncedCallback, cleanup };
  };

// function to create dummy message object.
export function createMessageCopy(msg:CometChat.AIAssistantBaseEvent,user:CometChat.User,category?: string, type?: string) {
  let message = {
    ...msg,
    getId: () => msg?.messageId || CometChatUIKitUtility.getUnixTimestamp(),
    getMessageId: () => msg?.messageId || CometChatUIKitUtility.getUnixTimestamp(),
    getSender: () => user,
    getReceiverType: () => CometChatUIKitConstants.MessageReceiverType.user,
    getReceiver: () => CometChatUIKitLoginListener.getLoggedInUser(),
    getCategory: () => category || CometChatUIKitConstants.MessageCategory.custom,
    getType: () => msg?.getType() || CometChatUIKitConstants.streamMessageTypes.run_started,
    getText: () => "",
    getParentMessageId: () => "",
    getSentAt: () => "",
    getReactions: () => [],
    getMentions: () => [],
    setId: (value: number) => { },
    setSender: (value: any) => { },
    setReceiverType: (value: string) => { },
    setReceiver: (value: any) => { },
    setCategory: (value: string) => { },
    setType: (value: string) => { },
    setText: (value: string) => { },
    setParentMessageId: (value: number) => { },
    setSentAt: (value: number) => { },
    setReactions: (reactions: any) => [],
    setMentionedUsers: (mentionedUsers: any[]) => { },
    setMuid: (value: string) => { },
    getConversationId: () => "",
    setConversationId: (value: string) => { },
    getUnreadRepliesCount: () => 0,
    setUnreadRepliesCount: (value: number) => { },
    getStatus: () => "",
    setStatus: (value: string) => { },
    getDeliveredAt: () => 0,
    setDeliveredAt: (value: number) => { },
    getDeliveredToMeAt: () => 0,
    setDeliveredToMeAt: (value: number) => { },
    getReadAt: () => 0,
    setReadAt: (value: number) => { },
    getReadByMeAt: () => 0,
    setReadByMeAt: (value: number) => { },
    getEditedAt: () => 0,
    setEditedAt: (value: number) => { },
    getEditedBy: () => "",
    setEditedBy: (value: string) => { },
    getDeletedAt: () => 0,
    setDeletedAt: (value: number) => { },
    getDeletedBy: () => "",
    setDeletedBy: (value: string) => { },
    getReplyCount: () => 0,
    setReplyCount: (value: number) => { },
    getRawMessage: () => ({}),
    setRawMessage: (rawMessage: Object) => { },
    setHasMentionedMe: (hasMentionedMe: boolean) => { },
    hasMentionedMe: () => false,
    getData: () => msg?.data,
    setData: (value: object) => { },
    getMuid: ()=> CometChatUIKitUtility.getUnixTimestamp()

  }
  return message as unknown as CometChat.BaseMessage;
  }

export function createMessageCopyFromBaseMessage(
  msg: CometChat.BaseMessage,
  user: CometChat.User | undefined
) {
  let message = {
    ...msg,
    getId: () => msg.getId() ?? CometChatUIKitUtility.getUnixTimestamp(),
    getMessageId: () => msg.getId() ?? CometChatUIKitUtility.getUnixTimestamp(),
    getSender: () => user,
    getReceiverType: () => CometChatUIKitConstants.MessageReceiverType.user,
    getReceiver: () => CometChatUIKitLoginListener.getLoggedInUser(),
    getCategory: () => CometChatUIKitConstants.MessageCategory.custom,
    getType: () => CometChatUIKitConstants.streamMessageTypes.run_started,
    getText: () => "",
    getParentMessageId: () => "",
    getSentAt: () => "",
    getReactions: () => [],
    getMentions: () => [],
    setId: (value: number) => {},
    setSender: (value: any) => {},
    setReceiverType: (value: string) => {},
    setReceiver: (value: any) => {},
    setCategory: (value: string) => {},
    setType: (value: string) => {},
    setText: (value: string) => {},
    setParentMessageId: (value: number) => {},
    setSentAt: (value: number) => {},
    setReactions: (reactions: any) => [],
    setMentionedUsers: (mentionedUsers: any[]) => {},
    setMuid: (value: string) => {},
    getConversationId: () => "",
    setConversationId: (value: string) => {},
    getUnreadRepliesCount: () => 0,
    setUnreadRepliesCount: (value: number) => {},
    getStatus: () => "",
    setStatus: (value: string) => {},
    getDeliveredAt: () => 0,
    setDeliveredAt: (value: number) => {},
    getDeliveredToMeAt: () => 0,
    setDeliveredToMeAt: (value: number) => {},
    getReadAt: () => 0,
    setReadAt: (value: number) => {},
    getReadByMeAt: () => 0,
    setReadByMeAt: (value: number) => {},
    getEditedAt: () => 0,
    setEditedAt: (value: number) => {},
    getEditedBy: () => "",
    setEditedBy: (value: string) => {},
    getDeletedAt: () => 0,
    setDeletedAt: (value: number) => {},
    getDeletedBy: () => "",
    setDeletedBy: (value: string) => {},
    getReplyCount: () => 0,
    setReplyCount: (value: number) => {},
    getRawMessage: () => ({}),
    setRawMessage: (rawMessage: Object) => {},
    setHasMentionedMe: (hasMentionedMe: boolean) => {},
    hasMentionedMe: () => false,
    getData: () => {
      return {
        runId: msg.getId(),
        threadId: ""
      };
    },
    setData: (value: object) => {},
    getMuid: () => CometChatUIKitUtility.getUnixTimestamp(),
  };
  return message as unknown as CometChat.BaseMessage;
}

  export function isDarkMode(){
      return document.querySelector('[data-theme="dark"]') ? true : false;
  }

/**
 * @function isIOS
 * @description Checks if the current device is running iOS (iPhone, iPad, or iPod).
 * It handles modern iPads (iOS 13+) which often report as 'Mac' but support touch.
 * @returns {boolean} True if the device is running iOS, false otherwise.
 */
  const isIOS = (): boolean => { 
    if (navigator.userAgent.includes("Mac") && 'ontouchend' in document) {
      return true;
  }

  // 2. Check for classic iOS user agent strings (iPhone, iPad, iPod).
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
* @function isMac
* @description Checks if the current device is running macOS.
* It explicitly excludes modern iPads that mimic the Mac user agent but support touch.
* @returns {boolean} True if the device is running macOS, false otherwise.
*/
  const isMac = (): boolean => {
    if (navigator.userAgent.includes("Mac") && 'ontouchend' in document) {
      return false;
  }

    const userAgent = navigator.userAgent.toLowerCase();
    return /macintosh|mac os x/.test(userAgent);
  }

/**
 * @function shouldShowCustomMimeTypes
 * @description Returns true if the device is running either iOS (iPhone, iPad, iPod) or macOS.
 * @returns {boolean} True if the device is an Apple device (iOS or macOS), false otherwise.
 */
 export const shouldShowCustomMimeTypes = (): boolean=>{
  return isIOS() || isMac();
}