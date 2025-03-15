import WaveSurfer from "../components/BaseComponents/CometChatAudioBubble/src/wavesurfer";

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
export function sanitizeHtml(htmlString: string, whitelistRegExes: RegExp[]) {
    if (!htmlString) {
        return "";
    }

    if (!Array.isArray(whitelistRegExes)) {
        return htmlString;
    }

    let returnString = htmlString;

    try {
        returnString = htmlString.replace(/<[^>]+>?/g, function (match) {
            const combinedRegex = new RegExp(
                "(" + whitelistRegExes.map((regex) => regex.source).join("|") + ")"
            );
            return combinedRegex.test(match)
                ? match
                : match.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        });
    } catch (error) {
        console.log(error);
    }

    return returnString;
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
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++, offset += 2) {
        const sample = Math.max(-1, Math.min(1, channelData[i])); // Clamp values
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true); // Write PCM sample
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
  export function fireClickEvent(){
    if(window)
     window.dispatchEvent(new CustomEvent('overlayclick'));
}