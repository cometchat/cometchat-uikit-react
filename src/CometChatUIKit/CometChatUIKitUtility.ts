import { BaseMessage, CometChat } from "@cometchat/chat-sdk-javascript";

interface metadataType {
  metadata: {
    "@injected": {
      "extensions": {
        [key: string]: {}[],
      }
    },
  }
}
interface MessageExtensionType {
  hasXSS?: string;
  sanitized_text?: string;
  data?: {
    sensitive_data: string;
    message_masked: string;
  }
  profanity?: string;
  message_clean?: string;
}
/**
  * Utility class for CometChat UIKit, providing various helper methods 
  * such as deep cloning, ID generation, Unix timestamp retrieval, 
  * and message extension data handling.
  */
export class CometChatUIKitUtility {
  /**
   * Creates a deep copy of the value provided
   *
   * @remarks
   * This function cannot copy truly private properties (those that start with a "#" symbol inside a class block).
   * Functions are copied by reference and additional properties on the array objects are ignored
   *
   * @param arg - Any value
   * @returns A deep copy of `arg`
   */
  static clone<T>(arg: T): T {
    /*
      If there are additional properties attached to a function or an array object other than the standard properties,
          those properties will be ignored
      Cannot copy private properties (those that start with a "#" symbol inside a class block)
      Functions are copied by reference
  */
    if (typeof arg !== "object" || !arg) {
      return arg;
    }

    let res;

    if (Array.isArray(arg)) {
      // arg is an array, there's no hatch to fool the Array.isArray method, so lets create an array
      res = [];
      for (const value of arg) {
        res.push(CometChatUIKitUtility.clone(value));
      }
      return res as T;
    } else {
      /*
        If the argument is an object, create a new object and recursively clone
        each property. This approach handles both data and accessor properties.
      */
      res = {};
      const descriptor = Object.getOwnPropertyDescriptors(arg);
      for (const k of Reflect.ownKeys(descriptor)) {
        const curDescriptor = descriptor[k as string];

        if (curDescriptor.hasOwnProperty("value")) {
          // Property is a data property
          Object.defineProperty(res, k, {
            ...curDescriptor,
            value: CometChatUIKitUtility.clone(curDescriptor["value"]),
          });
        } else {
          // Property is an accessor property
          Object.defineProperty(res, k, curDescriptor);
        }
      }
      Object.setPrototypeOf(res, Object.getPrototypeOf(arg));
    }

    return res as T;
  }

  /**
   * Checks if an object has a specific property.
   *
   * @param obj - The object to check.
   * @param key - The property key.
   * @returns `true` if the property exists, `false` otherwise.
   */
  static checkHasOwnProperty = (obj: object = {}, key: string) => {
    return Object.prototype.hasOwnProperty.call(obj, key);
  };


  /**
   * Generates a unique ID.
   *
   * @returns A unique string identifier.
   */
  static ID = () => {
    return "_" + Math.random().toString(36).substr(2, 9);
  };

  /**
   * Retrieves the current Unix timestamp.
   *
   * @returns The Unix timestamp.
   */
  static getUnixTimestamp = () => {
    return Math.round(+new Date() / 1000);
  };

  /**
   * Retrieves the extension data from a message.
   *
   * @param messageObject - The message object containing extensions.
   * @returns The sanitized message text if available, otherwise the original text.
   */
  static getExtensionData(messageObject: CometChat.BaseMessage) {
    let messageText;
    //xss extensions data
    const xssData: (object & MessageExtensionType) | undefined = CometChatUIKitUtility.checkMessageForExtensionsData(
      messageObject,
      "xss-filter"
    );
    if (
      xssData &&
      CometChatUIKitUtility.checkHasOwnProperty(xssData, "sanitized_text") &&
      CometChatUIKitUtility.checkHasOwnProperty(xssData, "hasXSS") &&
      xssData.hasXSS === "yes"
    ) {
      messageText = xssData?.sanitized_text;
    }
    //datamasking extensions data
    const maskedData: (object & MessageExtensionType) | undefined = CometChatUIKitUtility.checkMessageForExtensionsData(
      messageObject,
      "data-masking"
    );
    if (
      maskedData &&
      CometChatUIKitUtility.checkHasOwnProperty(maskedData, "data") &&
      CometChatUIKitUtility.checkHasOwnProperty(
        maskedData.data,
        "sensitive_data"
      ) &&
      CometChatUIKitUtility.checkHasOwnProperty(
        maskedData.data,
        "message_masked"
      ) &&
      maskedData.data?.sensitive_data === "yes"
    ) {
      messageText = maskedData?.data?.message_masked;
    }
    //profanity extensions data
    const profaneData: (object & MessageExtensionType) | undefined =
      CometChatUIKitUtility.checkMessageForExtensionsData(
        messageObject,
        "profanity-filter"
      );
    if (
      profaneData &&
      CometChatUIKitUtility.checkHasOwnProperty(profaneData, "profanity") &&
      CometChatUIKitUtility.checkHasOwnProperty(profaneData, "message_clean") &&
      profaneData.profanity === "yes"
    ) {
      messageText = profaneData?.message_clean;
    }
    return messageText || (messageObject as BaseMessage & { text: string }).text;
  }

  /**
   * Checks for extension data in a message.
   *
   * @param message - The message object to check.
   * @param extensionKey - The extension key to look for.
   * @returns The extension data if found.
   */
  static checkMessageForExtensionsData = (
    message: CometChat.BaseMessage | null,
    extensionKey: string
  ) => {
    try {
      let output: object & MessageExtensionType = {};
      if (message!.hasOwnProperty("metadata")) {
        const metadata = (message as BaseMessage & metadataType)?.["metadata"];
        const injectedObject = metadata["@injected"];
        if (injectedObject && injectedObject.hasOwnProperty("extensions")) {
          const extensionsObject = injectedObject["extensions"];
          if (
            extensionsObject &&
            extensionsObject.hasOwnProperty(extensionKey)
          ) {
            output = extensionsObject[extensionKey];
          }
        }
      }
      return output;
    } catch (error: unknown) { }
  };

  /**
   * Process and sanitize text to escape dangerous HTML while preserving mention formatting
   * @param text The text string that may contain HTML and mentions
   * @returns Sanitized string with dangerous HTML escaped but mentions preserved
   */
  static sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return text;

    return text.replace(/<[^>]*>/g, (match) => {
      const inner = match.slice(1,-1).trim();

      // Proper HTML tags: optional / then letter
      if (/^\/?[a-zA-Z]/.test(inner)) {
        return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      // Pseudo-tags like <@uid:...> without closing tag => leave as-is
      if (/^@/.test(inner)) {
        return match;
      }

      // Empty tags, fragments, or any invalid HTML → escape so they render literally
      return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    });
  }

  static convertBlobToWav = async (audioBlob: { arrayBuffer: () => any }) => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wavBuffer = CometChatUIKitUtility.audioBufferToWav(audioBuffer);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
  
    return {wavBlob};
  };
  
  static audioBufferToWav = (audioBuffer: AudioBuffer) => {
    const numOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numOfChannels * 2 + 44; // 44 bytes for WAV header
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
  
    CometChatUIKitUtility.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioBuffer.length * numOfChannels * 2, true); // File size - 8
    CometChatUIKitUtility.writeString(view, 8, 'WAVE');
    CometChatUIKitUtility.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1 size (PCM)
    view.setUint16(20, 1, true);  // Audio format (1 = PCM)
    view.setUint16(22, numOfChannels, true); // Num channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * numOfChannels * 2, true); // Byte rate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, numOfChannels * 2, true); // Block align (NumChannels * BitsPerSample/8)
    view.setUint16(34, 16, true); // Bits per sample (16 bits)
    CometChatUIKitUtility.writeString(view, 36, 'data');
    view.setUint32(40, audioBuffer.length * numOfChannels * 2, true); // Data chunk size
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const intSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
  
    return buffer;
  };
  
  static writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  static convertToWav = async (audioBlob: Blob) => {
    const {wavBlob} = await CometChatUIKitUtility.convertBlobToWav(audioBlob);
    const file = new File([wavBlob], 'audio.wav', { type: 'audio/wav' });
    const mediaMessage = new CometChat.MediaMessage('superhero2', file, CometChat.MESSAGE_TYPE.AUDIO, CometChat.RECEIVER_TYPE.USER);
    const message = await CometChat.sendMediaMessage(mediaMessage);
    const url = (message as CometChat.MediaMessage).getAttachment().getUrl();
    return url;
  }
}
