class CometChatUserEvents {
  static onItemClick = "onItemClick";

  static _triggers = {};

  static emit = (...args) => {
    let event, params;
    if (args.length === 2) {
      [event, params] = args;
    } else if (args.length === 1 && typeof args[0] === "object") {
      event = args[0].event;
      params = args[0].params;
    } else {
      throw new Error("Invalid arguments");
    }

    if (CometChatUserEvents._triggers[event]) {
      for (const i in CometChatUserEvents._triggers[event]) {
        CometChatUserEvents._triggers[event][i](params);
      }
    }
  };

  static removeListener = (...args) => {
    let event, id;
    if (args.length === 2) {
      [event, id] = args;
    } else if (args.length === 1 && typeof args[0] === "object") {
      event = args[0].event;
      id = args[0].id;
    } else {
      throw new Error("Invalid arguments");
    }

    if (CometChatUserEvents._triggers[event]) {
      delete CometChatUserEvents._triggers[event][id];
    }
  };

  static addListener = (...args) => {
    let event, id, callback;
    if (args.length === 3) {
      [event, id, callback] = args;
    } else if (args.length === 1 && typeof args[0] === "object") {
      event = args[0].event;
      id = args[0].id;
      callback = args[0].callback;
    } else {
      throw new Error("Invalid arguments");
    }

    if (!CometChatUserEvents._triggers[event]) {
      CometChatUserEvents._triggers[event] = {};
    }

    CometChatUserEvents._triggers[event][id] = callback;
  };
}

export { CometChatUserEvents };
