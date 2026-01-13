declare global {
    interface Window {
        ReactNativeWebView?: {
            postMessage: (message: string) => void;
        };
    }
}

interface dataToSend {
    // Define the structure of dataToSend here
    type: string;
    payload?: any;
}

export const sendMessageToMobileApp = (sendData: dataToSend) => {
    // Function to send message to mobile app

    window.ReactNativeWebView?.postMessage(
        JSON.stringify(sendData)
    );

}