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
   * Convert known rich-text HTML formatting tags to markdown.
   * This handles messages that arrive with raw HTML (from other platforms or older clients)
   * so they can be processed by the markdown formatter on the bubble side.
   * Also handles HTML-entity-escaped tags (e.g., &lt;i&gt;text&lt;/i&gt;).
   * Only converts recognized formatting tags; unknown/dangerous HTML is left for sanitizeText.
   */
  static convertFormattingHtmlToMarkdown(text: string): string {
    if (!text || typeof text !== 'string') return text;

    // First, decode HTML entities for formatting tags so they can be detected
    // Convert &lt;i&gt; back to <i> etc., but only for known formatting tags
    let decoded = text;
    const entityPattern = /&lt;(\/?)(b|strong|i|em|u|s|strike|del|code|pre|blockquote|a|ol|ul|li)((?:\s[^&]*)?)&gt;/gi;
    if (entityPattern.test(text)) {
      decoded = text.replace(/&lt;(\/?)(b|strong|i|em|u|s|strike|del|code|pre|blockquote|a|ol|ul|li)((?:\s[^&]*)?)&gt;/gi,
        '<$1$2$3>');
    }

    // Quick check: does the text contain any HTML formatting tags?
    const formattingTagPattern = /<\/?(b|strong|i|em|u|s|strike|del|code|pre|blockquote|a|ol|ul|li|p|div)[\s>]/i;
    if (!formattingTagPattern.test(decoded)) return text;

    // Preserve mention tokens (<@uid:...> and <@all:...>) before DOM parsing
    // The browser's HTML parser would strip/mangle these pseudo-tags
    const mentionPlaceholders: string[] = [];
    decoded = decoded.replace(/<@(uid|all):[^>]+>/g, (match) => {
      const idx = mentionPlaceholders.length;
      mentionPlaceholders.push(match);
      return `\u200B__MENTION_${idx}__\u200B`;
    });

    // Use a temporary DOM element to parse and convert
    const container = document.createElement('div');
    container.innerHTML = decoded;

    const processNode = (node: Node, depth: number = 0): string => {
      let result = '';
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === Node.TEXT_NODE) {
          result += child.textContent || '';
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tag = el.tagName.toUpperCase();
          const inner = processNode(el, depth);

          switch (tag) {
            case 'B': case 'STRONG':
              result += `**${inner}**`; break;
            case 'I': case 'EM':
              result += `_${inner}_`; break;
            case 'U':
              result += `<u>${inner}</u>`; break;
            case 'S': case 'STRIKE': case 'DEL':
              result += `~~${inner}~~`; break;
            case 'PRE': {
              const codeContent = el.querySelector('code')?.textContent || inner;
              result += `\`\`\`${codeContent}\`\`\``; break;
            }
            case 'CODE':
              if (el.parentElement?.tagName === 'PRE') { result += inner; }
              else { result += `\`${inner}\``; }
              break;
            case 'BLOCKQUOTE': {
              const bqLines = inner.split('\n');
              while (bqLines.length > 0 && bqLines[bqLines.length - 1].trim() === '') {
                bqLines.pop();
              }
              result += bqLines.map((l: string) => `> ${l}`).join('\n'); break;
            }
            case 'A': {
              const href = el.getAttribute('href') || '';
              result += `[${inner || href}](${href})`; break;
            }
            case 'OL': {
              let idx = 1;
              const indent = '    '.repeat(depth);
              for (let j = 0; j < el.children.length; j++) {
                if (el.children[j].tagName === 'LI') {
                  const li = el.children[j];
                  let textContent = '';
                  let nestedListContent = '';
                  for (let k = 0; k < li.childNodes.length; k++) {
                    const liChild = li.childNodes[k];
                    if (liChild.nodeType === Node.ELEMENT_NODE) {
                      const liChildTag = (liChild as HTMLElement).tagName.toUpperCase();
                      if (liChildTag === 'OL' || liChildTag === 'UL') {
                        nestedListContent += processNode(liChild, depth + 1);
                      } else {
                        textContent += processNode(liChild, depth);
                      }
                    } else {
                      textContent += liChild.textContent || '';
                    }
                  }
                  const trimmed = textContent.replace(/\n/g, '').trim();
                  if (trimmed) {
                    result += `${indent}${idx}. ${textContent}\n`; idx++;
                  }
                  if (nestedListContent) {
                    result += nestedListContent;
                  }
                }
              }
              break;
            }
            case 'UL': {
              const indent = '    '.repeat(depth);
              for (let j = 0; j < el.children.length; j++) {
                if (el.children[j].tagName === 'LI') {
                  const li = el.children[j];
                  let textContent = '';
                  let nestedListContent = '';
                  for (let k = 0; k < li.childNodes.length; k++) {
                    const liChild = li.childNodes[k];
                    if (liChild.nodeType === Node.ELEMENT_NODE) {
                      const liChildTag = (liChild as HTMLElement).tagName.toUpperCase();
                      if (liChildTag === 'OL' || liChildTag === 'UL') {
                        nestedListContent += processNode(liChild, depth + 1);
                      } else {
                        textContent += processNode(liChild, depth);
                      }
                    } else {
                      textContent += liChild.textContent || '';
                    }
                  }
                  const trimmed = textContent.replace(/\n/g, '').trim();
                  if (trimmed) {
                    result += `${indent}• ${textContent}\n`;
                  }
                  if (nestedListContent) {
                    result += nestedListContent;
                  }
                }
              }
              break;
            }
            case 'LI': result += inner; break;
            case 'BR': result += '\n'; break;
            case 'DIV': case 'P': result += inner + '\n'; break;
            case 'SPAN': result += inner; break;
            default: result += inner; break;
          }
        }
      }
      return result;
    };

    let result = processNode(container).trim();

    // Restore mention tokens that were preserved before DOM parsing
    result = result.replace(/\u200B__MENTION_(\d+)__\u200B/g, (_, idx) => {
      return mentionPlaceholders[parseInt(idx, 10)];
    });

    return result;
  }

  /**
   * Process and sanitize text to escape dangerous HTML while preserving mention formatting
   * @param text The text string that may contain HTML and mentions
   * @returns Sanitized string with dangerous HTML escaped but mentions preserved
   */
  static sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return text;

    return text.replace(/<[^>]*>/g, (match) => {
      const inner = match.slice(1,-1).trim();

      // Preserve <u> and </u> tags — they are our underline markdown syntax
      if (/^\/?u$/i.test(inner)) {
        return match;
      }

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

  /**
   * Strips markdown formatting syntax from text, leaving only the plain text content.
   * Preserves mention tokens (<@uid:...> and <@all:...>) and line breaks.
   */
  static stripMarkdownFormatting(text: string): string {
    if (!text || typeof text !== 'string') return text;

    let result = text;

    // Preserve mention tokens before stripping
    const mentionPlaceholders: string[] = [];
    result = result.replace(/<@(uid|all):[^>]+>/g, (match) => {
      const idx = mentionPlaceholders.length;
      mentionPlaceholders.push(match);
      return `\u200B__MENTION_${idx}__\u200B`;
    });

    // Strip code blocks: ```content```
    result = result.replace(/```([\s\S]*?)```/g, '$1');
    // Strip inline code: `content`
    result = result.replace(/`([^`]+)`/g, '$1');
    // Strip bold: **content** (supports multiline)
    result = result.replace(/\*\*([\s\S]+?)\*\*/g, '$1');
    // Strip italic: _content_ (supports multiline)
    result = result.replace(/(?<!\w)_([\s\S]+?)_(?!\w)/g, '$1');
    // Strip strikethrough: ~~content~~ (supports multiline)
    result = result.replace(/~~([\s\S]+?)~~/g, '$1');
    // Strip blockquote markers: > text
    result = result.replace(/^>\s?/gm, '');
    // Strip ordered list markers: 1. text
    result = result.replace(/^\s*\d+\.\s/gm, '');
    // Strip unordered list markers: • text
    result = result.replace(/^\s*•\s/gm, '');
    // Strip underline HTML tags: <u>content</u>
    result = result.replace(/<\/?u>/gi, '');
    // Strip markdown links: [text](url) → text
    result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

    // Restore mention tokens
    result = result.replace(/\u200B__MENTION_(\d+)__\u200B/g, (_, idx) => {
      return mentionPlaceholders[parseInt(idx, 10)];
    });

    return result;
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
