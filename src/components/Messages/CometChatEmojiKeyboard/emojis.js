import Activity from "./resources/activity.svg";
import Animals from "./resources/animals.svg";
import Smileys from "./resources/smileys.svg";
import Symbols from "./resources/symbols.svg";
import Objects from "./resources/objects.svg";
import Travel from "./resources/travel.svg";
import Flags from "./resources/flags.svg";
import Food from "./resources/food.svg";

export const Emojis = [
  {
    people: {
      id: "people",
      name: "Smileys",
      symbol: Smileys,
      emojis: {
        grinning: {
          keywords: ["face", "smile", "happy", "joy", ":D", "grin"],
          char: "😀",
        },
        grimacing: {
          keywords: ["face", "grimace", "teeth"],
          char: "😬",
        },
        grin: {
          keywords: ["face", "happy", "smile", "joy", "kawaii"],
          char: "😁",
        },
        joy: {
          keywords: [
            "face",
            "cry",
            "tears",
            "weep",
            "happy",
            "happytears",
            "haha",
          ],
          char: "😂",
        },
        rofl: {
          keywords: ["face", "rolling", "floor", "laughing", "lol", "haha"],
          char: "🤣",
        },
        partying: {
          keywords: ["face", "celebration", "woohoo"],
          char: "🥳",
        },
        smiley: {
          keywords: [
            "face",
            "happy",
            "joy",
            "haha",
            ":D",
            ":)",
            "smile",
            "funny",
          ],
          char: "😃",
        },
        smile: {
          keywords: [
            "face",
            "happy",
            "joy",
            "funny",
            "haha",
            "laugh",
            "like",
            ":D",
            ":)",
          ],
          char: "😄",
        },
        sweat_smile: {
          keywords: [
            "face",
            "hot",
            "happy",
            "laugh",
            "sweat",
            "smile",
            "relief",
          ],
          char: "😅",
        },
        laughing: {
          keywords: [
            "happy",
            "joy",
            "lol",
            "satisfied",
            "haha",
            "face",
            "glad",
            "XD",
            "laugh",
          ],
          char: "😆",
        },
        innocent: {
          keywords: ["face", "angel", "heaven", "halo"],
          char: "😇",
        },
        wink: {
          keywords: [
            "face",
            "happy",
            "mischievous",
            "secret",
            ";)",
            "smile",
            "eye",
          ],
          char: "😉",
        },
        blush: {
          keywords: [
            "face",
            "smile",
            "happy",
            "flushed",
            "crush",
            "embarrassed",
            "shy",
            "joy",
          ],
          char: "😊",
        },
        slightly_smiling_face: {
          keywords: ["face", "smile"],
          char: "🙂",
        },
        upside_down_face: {
          keywords: ["face", "flipped", "silly", "smile"],
          char: "🙃",
        },
        relaxed: {
          keywords: ["face", "blush", "massage", "happiness"],
          char: "☺️",
        },
        yum: {
          keywords: [
            "happy",
            "joy",
            "tongue",
            "smile",
            "face",
            "silly",
            "yummy",
            "nom",
            "delicious",
            "savouring",
          ],
          char: "😋",
        },
        relieved: {
          keywords: ["face", "relaxed", "phew", "massage", "happiness"],
          char: "😌",
        },
        heart_eyes: {
          keywords: [
            "face",
            "love",
            "like",
            "affection",
            "valentines",
            "infatuation",
            "crush",
            "heart",
          ],
          char: "😍",
        },
        smiling_face_with_three_hearts: {
          keywords: [
            "face",
            "love",
            "like",
            "affection",
            "valentines",
            "infatuation",
            "crush",
            "hearts",
            "adore",
          ],
          char: "🥰",
        },
        kissing_heart: {
          keywords: [
            "face",
            "love",
            "like",
            "affection",
            "valentines",
            "infatuation",
            "kiss",
          ],
          char: "😘",
        },
        kissing: {
          keywords: [
            "love",
            "like",
            "face",
            "3",
            "valentines",
            "infatuation",
            "kiss",
          ],
          char: "😗",
        },
        kissing_smiling_eyes: {
          keywords: ["face", "affection", "valentines", "infatuation", "kiss"],
          char: "😙",
        },
        kissing_closed_eyes: {
          keywords: [
            "face",
            "love",
            "like",
            "affection",
            "valentines",
            "infatuation",
            "kiss",
          ],
          char: "😚",
        },
        stuck_out_tongue_winking_eye: {
          keywords: [
            "face",
            "prank",
            "childish",
            "playful",
            "mischievous",
            "smile",
            "wink",
            "tongue",
          ],
          char: "😜",
        },
        zany: {
          keywords: ["face", "goofy", "crazy"],
          char: "🤪",
        },
        raised_eyebrow: {
          keywords: [
            "face",
            "distrust",
            "scepticism",
            "disapproval",
            "disbelief",
            "surprise",
          ],
          char: "🤨",
        },
        monocle: {
          keywords: ["face", "stuffy", "wealthy"],
          char: "🧐",
        },
        stuck_out_tongue_closed_eyes: {
          keywords: [
            "face",
            "prank",
            "playful",
            "mischievous",
            "smile",
            "tongue",
          ],
          char: "😝",
        },
        stuck_out_tongue: {
          keywords: [
            "face",
            "prank",
            "childish",
            "playful",
            "mischievous",
            "smile",
            "tongue",
          ],
          char: "😛",
        },
        money_mouth_face: {
          keywords: ["face", "rich", "dollar", "money"],
          char: "🤑",
        },
        nerd_face: {
          keywords: ["face", "nerdy", "geek", "dork"],
          char: "🤓",
        },
        sunglasses: {
          keywords: ["face", "cool", "smile", "summer", "beach", "sunglass"],
          char: "😎",
        },
        star_struck: {
          keywords: ["face", "smile", "starry", "eyes", "grinning"],
          char: "🤩",
        },
        clown_face: {
          keywords: ["face"],
          char: "🤡",
        },
        cowboy_hat_face: {
          keywords: ["face", "cowgirl", "hat"],
          char: "🤠",
        },
        hugs: {
          keywords: ["face", "smile", "hug"],
          char: "🤗",
        },
        smirk: {
          keywords: ["face", "smile", "mean", "prank", "smug", "sarcasm"],
          char: "😏",
        },
        no_mouth: {
          keywords: ["face", "hellokitty"],
          char: "😶",
        },
        neutral_face: {
          keywords: ["indifference", "meh", ":|", "neutral"],
          char: "😐",
        },
        expressionless: {
          keywords: ["face", "indifferent", "-_-", "meh", "deadpan"],
          char: "😑",
        },
        unamused: {
          keywords: [
            "indifference",
            "bored",
            "straight face",
            "serious",
            "sarcasm",
            "unimpressed",
            "skeptical",
            "dubious",
            "side_eye",
          ],
          char: "😒",
        },
        roll_eyes: {
          keywords: ["face", "eyeroll", "frustrated"],
          char: "🙄",
        },
        thinking: {
          keywords: ["face", "hmmm", "think", "consider"],
          char: "🤔",
        },
        lying_face: {
          keywords: ["face", "lie", "pinocchio"],
          char: "🤥",
        },
        hand_over_mouth: {
          keywords: ["face", "whoops", "shock", "surprise"],
          char: "🤭",
        },
        shushing: {
          keywords: ["face", "quiet", "shhh"],
          char: "🤫",
        },
        symbols_over_mouth: {
          keywords: [
            "face",
            "swearing",
            "cursing",
            "cussing",
            "profanity",
            "expletive",
          ],
          char: "🤬",
        },
        exploding_head: {
          keywords: ["face", "shocked", "mind", "blown"],
          char: "🤯",
        },
        flushed: {
          keywords: ["face", "blush", "shy", "flattered"],
          char: "😳",
        },
        disappointed: {
          keywords: ["face", "sad", "upset", "depressed", ":("],
          char: "😞",
        },
        worried: {
          keywords: ["face", "concern", "nervous", ":("],
          char: "😟",
        },
        angry: {
          keywords: ["mad", "face", "annoyed", "frustrated"],
          char: "😠",
        },
        rage: {
          keywords: ["angry", "mad", "hate", "despise"],
          char: "😡",
        },
        pensive: {
          keywords: ["face", "sad", "depressed", "upset"],
          char: "😔",
        },
        confused: {
          keywords: ["face", "indifference", "huh", "weird", "hmmm", ":/"],
          char: "😕",
        },
        slightly_frowning_face: {
          keywords: ["face", "frowning", "disappointed", "sad", "upset"],
          char: "🙁",
        },
        frowning_face: {
          keywords: ["face", "sad", "upset", "frown"],
          char: "☹",
        },
        persevere: {
          keywords: ["face", "sick", "no", "upset", "oops"],
          char: "😣",
        },
        confounded: {
          keywords: ["face", "confused", "sick", "unwell", "oops", ":S"],
          char: "😖",
        },
        tired_face: {
          keywords: ["sick", "whine", "upset", "frustrated"],
          char: "😫",
        },
        weary: {
          keywords: ["face", "tired", "sleepy", "sad", "frustrated", "upset"],
          char: "😩",
        },
        pleading: {
          keywords: ["face", "begging", "mercy"],
          char: "🥺",
        },
        triumph: {
          keywords: ["face", "gas", "phew", "proud", "pride"],
          char: "😤",
        },
        open_mouth: {
          keywords: ["face", "surprise", "impressed", "wow", "whoa", ":O"],
          char: "😮",
        },
        scream: {
          keywords: ["face", "munch", "scared", "omg"],
          char: "😱",
        },
        fearful: {
          keywords: ["face", "scared", "terrified", "nervous", "oops", "huh"],
          char: "😨",
        },
        cold_sweat: {
          keywords: ["face", "nervous", "sweat"],
          char: "😰",
        },
        hushed: {
          keywords: ["face", "woo", "shh"],
          char: "😯",
        },
        frowning: {
          keywords: ["face", "aw", "what"],
          char: "😦",
        },
        anguished: {
          keywords: ["face", "stunned", "nervous"],
          char: "😧",
        },
        cry: {
          keywords: ["face", "tears", "sad", "depressed", "upset", ":'("],
          char: "😢",
        },
        disappointed_relieved: {
          keywords: ["face", "phew", "sweat", "nervous"],
          char: "😥",
        },
        drooling_face: {
          keywords: ["face"],
          char: "🤤",
        },
        sleepy: {
          keywords: ["face", "tired", "rest", "nap"],
          char: "😪",
        },
        sweat: {
          keywords: ["face", "hot", "sad", "tired", "exercise"],
          char: "😓",
        },
        hot: {
          keywords: ["face", "feverish", "heat", "red", "sweating"],
          char: "🥵",
        },
        cold: {
          keywords: [
            "face",
            "blue",
            "freezing",
            "frozen",
            "frostbite",
            "icicles",
          ],
          char: "🥶",
        },
        sob: {
          keywords: ["face", "cry", "tears", "sad", "upset", "depressed"],
          char: "😭",
        },
        dizzy_face: {
          keywords: ["spent", "unconscious", "xox", "dizzy"],
          char: "😵",
        },
        astonished: {
          keywords: ["face", "xox", "surprised", "poisoned"],
          char: "😲",
        },
        zipper_mouth_face: {
          keywords: ["face", "sealed", "zipper", "secret"],
          char: "🤐",
        },
        nauseated_face: {
          keywords: [
            "face",
            "vomit",
            "gross",
            "green",
            "sick",
            "throw up",
            "ill",
          ],
          char: "🤢",
        },
        sneezing_face: {
          keywords: ["face", "gesundheit", "sneeze", "sick", "allergy"],
          char: "🤧",
        },
        vomiting: {
          keywords: ["face", "sick"],
          char: "🤮",
        },
        mask: {
          keywords: ["face", "sick", "ill", "disease"],
          char: "😷",
        },
        face_with_thermometer: {
          keywords: ["sick", "temperature", "thermometer", "cold", "fever"],
          char: "🤒",
        },
        face_with_head_bandage: {
          keywords: ["injured", "clumsy", "bandage", "hurt"],
          char: "🤕",
        },
        woozy: {
          keywords: ["face", "dizzy", "intoxicated", "tipsy", "wavy"],
          char: "🥴",
        },
        sleeping: {
          keywords: ["face", "tired", "sleepy", "night", "zzz"],
          char: "😴",
        },
        zzz: {
          keywords: ["sleepy", "tired", "dream"],
          char: "💤",
        },
        poop: {
          keywords: ["hankey", "shitface", "fail", "turd", "shit"],
          char: "💩",
        },
        smiling_imp: {
          keywords: ["devil", "horns"],
          char: "😈",
        },
        imp: {
          keywords: ["devil", "angry", "horns"],
          char: "👿",
        },
        japanese_ogre: {
          keywords: [
            "monster",
            "red",
            "mask",
            "halloween",
            "scary",
            "creepy",
            "devil",
            "demon",
            "japanese",
            "ogre",
          ],
          char: "👹",
        },
        japanese_goblin: {
          keywords: [
            "red",
            "evil",
            "mask",
            "monster",
            "scary",
            "creepy",
            "japanese",
            "goblin",
          ],
          char: "👺",
        },
        skull: {
          keywords: ["dead", "skeleton", "creepy", "death"],
          char: "💀",
        },
        ghost: {
          keywords: ["halloween", "spooky", "scary"],
          char: "👻",
        },
        alien: {
          keywords: ["UFO", "paul", "weird", "outer_space"],
          char: "👽",
        },
        robot: {
          keywords: ["computer", "machine", "bot"],
          char: "🤖",
        },
        smiley_cat: {
          keywords: ["animal", "cats", "happy", "smile"],
          char: "😺",
        },
        smile_cat: {
          keywords: ["animal", "cats", "smile"],
          char: "😸",
        },
        joy_cat: {
          keywords: ["animal", "cats", "haha", "happy", "tears"],
          char: "😹",
        },
        heart_eyes_cat: {
          keywords: [
            "animal",
            "love",
            "like",
            "affection",
            "cats",
            "valentines",
            "heart",
          ],
          char: "😻",
        },
        smirk_cat: {
          keywords: ["animal", "cats", "smirk"],
          char: "😼",
        },
        kissing_cat: {
          keywords: ["animal", "cats", "kiss"],
          char: "😽",
        },
        scream_cat: {
          keywords: ["animal", "cats", "munch", "scared", "scream"],
          char: "🙀",
        },
        crying_cat_face: {
          keywords: ["animal", "tears", "weep", "sad", "cats", "upset", "cry"],
          char: "😿",
        },
        pouting_cat: {
          keywords: ["animal", "cats"],
          char: "😾",
        },
        palms_up: {
          keywords: ["hands", "gesture", "cupped", "prayer"],
          char: "🤲",
          fitzpatrick_scale: true,
        },
        raised_hands: {
          keywords: ["gesture", "hooray", "yea", "celebration", "hands"],
          char: "🙌",
          fitzpatrick_scale: true,
        },
        clap: {
          keywords: ["hands", "praise", "applause", "congrats", "yay"],
          char: "👏",
          fitzpatrick_scale: true,
        },
        wave: {
          keywords: [
            "hands",
            "gesture",
            "goodbye",
            "solong",
            "farewell",
            "hello",
            "hi",
            "palm",
          ],
          char: "👋",
          fitzpatrick_scale: true,
        },
        call_me_hand: {
          keywords: ["hands", "gesture"],
          char: "🤙",
          fitzpatrick_scale: true,
        },
        "+1": {
          keywords: [
            "thumbsup",
            "yes",
            "awesome",
            "good",
            "agree",
            "accept",
            "cool",
            "hand",
            "like",
          ],
          char: "👍",
          fitzpatrick_scale: true,
        },
        "-1": {
          keywords: ["thumbsdown", "no", "dislike", "hand"],
          char: "👎",
          fitzpatrick_scale: true,
        },
        facepunch: {
          keywords: ["angry", "violence", "fist", "hit", "attack", "hand"],
          char: "👊",
          fitzpatrick_scale: true,
        },
        fist: {
          keywords: ["fingers", "hand", "grasp"],
          char: "✊",
          fitzpatrick_scale: true,
        },
        fist_left: {
          keywords: ["hand", "fistbump"],
          char: "🤛",
          fitzpatrick_scale: true,
        },
        fist_right: {
          keywords: ["hand", "fistbump"],
          char: "🤜",
          fitzpatrick_scale: true,
        },
        v: {
          keywords: ["fingers", "ohyeah", "hand", "peace", "victory", "two"],
          char: "✌",
          fitzpatrick_scale: true,
        },
        ok_hand: {
          keywords: ["fingers", "limbs", "perfect", "ok", "okay"],
          char: "👌",
          fitzpatrick_scale: true,
        },
        raised_hand: {
          keywords: ["fingers", "stop", "highfive", "palm", "ban"],
          char: "✋",
          fitzpatrick_scale: true,
        },
        raised_back_of_hand: {
          keywords: ["fingers", "raised", "backhand"],
          char: "🤚",
          fitzpatrick_scale: true,
        },
        open_hands: {
          keywords: ["fingers", "butterfly", "hands", "open"],
          char: "👐",
          fitzpatrick_scale: true,
        },
        muscle: {
          keywords: ["arm", "flex", "hand", "summer", "strong", "biceps"],
          char: "💪",
          fitzpatrick_scale: true,
        },
        pray: {
          keywords: ["please", "hope", "wish", "namaste", "highfive"],
          char: "🙏",
          fitzpatrick_scale: true,
        },
        foot: {
          keywords: ["kick", "stomp"],
          char: "🦶",
          fitzpatrick_scale: true,
        },
        leg: {
          keywords: ["kick", "limb"],
          char: "🦵",
          fitzpatrick_scale: true,
        },
        handshake: {
          keywords: ["agreement", "shake"],
          char: "🤝",
        },
        point_up: {
          keywords: ["hand", "fingers", "direction", "up"],
          char: "☝",
          fitzpatrick_scale: true,
        },
        point_up_2: {
          keywords: ["fingers", "hand", "direction", "up"],
          char: "👆",
          fitzpatrick_scale: true,
        },
        point_down: {
          keywords: ["fingers", "hand", "direction", "down"],
          char: "👇",
          fitzpatrick_scale: true,
        },
        point_left: {
          keywords: ["direction", "fingers", "hand", "left"],
          char: "👈",
          fitzpatrick_scale: true,
        },
        point_right: {
          keywords: ["fingers", "hand", "direction", "right"],
          char: "👉",
          fitzpatrick_scale: true,
        },
        fu: {
          keywords: ["hand", "fingers", "rude", "middle", "flipping"],
          char: "🖕",
          fitzpatrick_scale: true,
        },
        raised_hand_with_fingers_splayed: {
          keywords: ["hand", "fingers", "palm"],
          char: "🖐",
          fitzpatrick_scale: true,
        },
        love_you: {
          keywords: ["hand", "fingers", "gesture"],
          char: "🤟",
          fitzpatrick_scale: true,
        },
        metal: {
          keywords: ["hand", "fingers", "evil_eye", "sign_of_horns", "rock_on"],
          char: "🤘",
          fitzpatrick_scale: true,
        },
        crossed_fingers: {
          keywords: ["good", "lucky"],
          char: "🤞",
          fitzpatrick_scale: true,
        },
        vulcan_salute: {
          keywords: ["hand", "fingers", "spock", "star trek"],
          char: "🖖",
          fitzpatrick_scale: true,
        },
        writing_hand: {
          keywords: [
            "lower_left_ballpoint_pen",
            "stationery",
            "write",
            "compose",
          ],
          char: "✍",
          fitzpatrick_scale: true,
        },
        selfie: {
          keywords: ["camera", "phone"],
          char: "🤳",
          fitzpatrick_scale: true,
        },
        nail_care: {
          keywords: ["beauty", "manicure", "finger", "fashion", "nail"],
          char: "💅",
          fitzpatrick_scale: true,
        },
        lips: {
          keywords: ["mouth", "kiss"],
          char: "👄",
        },
        tooth: {
          keywords: ["teeth", "dentist"],
          char: "🦷",
        },
        tongue: {
          keywords: ["mouth", "playful"],
          char: "👅",
        },
        ear: {
          keywords: ["face", "hear", "sound", "listen"],
          char: "👂",
          fitzpatrick_scale: true,
        },
        nose: {
          keywords: ["smell", "sniff"],
          char: "👃",
          fitzpatrick_scale: true,
        },
        eye: {
          keywords: ["face", "look", "see", "watch", "stare"],
          char: "👁",
        },
        eyes: {
          keywords: ["look", "watch", "stalk", "peek", "see"],
          char: "👀",
        },
        brain: {
          keywords: ["smart", "intelligent"],
          char: "🧠",
        },
        bust_in_silhouette: {
          keywords: ["user", "person", "human"],
          char: "👤",
        },
        busts_in_silhouette: {
          keywords: ["user", "person", "human", "group", "team"],
          char: "👥",
        },
        speaking_head: {
          keywords: ["user", "person", "human", "sing", "say", "talk"],
          char: "🗣",
        },
        baby: {
          keywords: ["child", "boy", "girl", "toddler"],
          char: "👶",
          fitzpatrick_scale: true,
        },
        child: {
          keywords: ["gender-neutral", "young"],
          char: "🧒",
          fitzpatrick_scale: true,
        },
        boy: {
          keywords: ["man", "male", "guy", "teenager"],
          char: "👦",
          fitzpatrick_scale: true,
        },
        girl: {
          keywords: ["female", "woman", "teenager"],
          char: "👧",
          fitzpatrick_scale: true,
        },
        adult: {
          keywords: ["gender-neutral", "person"],
          char: "🧑",
          fitzpatrick_scale: true,
        },
        man: {
          keywords: [
            "mustache",
            "father",
            "dad",
            "guy",
            "classy",
            "sir",
            "moustache",
          ],
          char: "👨",
          fitzpatrick_scale: true,
        },
        woman: {
          keywords: ["female", "girls", "lady"],
          char: "👩",
          fitzpatrick_scale: true,
        },
        blonde_woman: {
          keywords: ["woman", "female", "girl", "blonde", "person"],
          char: "👱‍♀️",
          fitzpatrick_scale: true,
        },
        blonde_man: {
          keywords: ["man", "male", "boy", "blonde", "guy", "person"],
          char: "👱",
          fitzpatrick_scale: true,
        },
        bearded_person: {
          keywords: ["person", "bewhiskered"],
          char: "🧔",
          fitzpatrick_scale: true,
        },
        older_adult: {
          keywords: ["human", "elder", "senior", "gender-neutral"],
          char: "🧓",
          fitzpatrick_scale: true,
        },
        older_man: {
          keywords: ["human", "male", "men", "old", "elder", "senior"],
          char: "👴",
          fitzpatrick_scale: true,
        },
        older_woman: {
          keywords: [
            "human",
            "female",
            "women",
            "lady",
            "old",
            "elder",
            "senior",
          ],
          char: "👵",
          fitzpatrick_scale: true,
        },
        man_with_gua_pi_mao: {
          keywords: ["male", "boy", "chinese"],
          char: "👲",
          fitzpatrick_scale: true,
        },
        woman_with_headscarf: {
          keywords: ["female", "hijab", "mantilla", "tichel"],
          char: "🧕",
          fitzpatrick_scale: true,
        },
        woman_with_turban: {
          keywords: ["female", "indian", "hinduism", "arabs", "woman"],
          char: "👳‍♀️",
          fitzpatrick_scale: true,
        },
        man_with_turban: {
          keywords: ["male", "indian", "hinduism", "arabs"],
          char: "👳",
          fitzpatrick_scale: true,
        },
        policewoman: {
          keywords: [
            "woman",
            "police",
            "law",
            "legal",
            "enforcement",
            "arrest",
            "911",
            "female",
          ],
          char: "👮‍♀️",
          fitzpatrick_scale: true,
        },
        policeman: {
          keywords: [
            "man",
            "police",
            "law",
            "legal",
            "enforcement",
            "arrest",
            "911",
          ],
          char: "👮",
          fitzpatrick_scale: true,
        },
        construction_worker_woman: {
          keywords: [
            "female",
            "human",
            "wip",
            "build",
            "construction",
            "worker",
            "labor",
            "woman",
          ],
          char: "👷‍♀️",
          fitzpatrick_scale: true,
        },
        construction_worker_man: {
          keywords: [
            "male",
            "human",
            "wip",
            "guy",
            "build",
            "construction",
            "worker",
            "labor",
          ],
          char: "👷",
          fitzpatrick_scale: true,
        },
        guardswoman: {
          keywords: ["uk", "gb", "british", "female", "royal", "woman"],
          char: "💂‍♀️",
          fitzpatrick_scale: true,
        },
        guardsman: {
          keywords: ["uk", "gb", "british", "male", "guy", "royal"],
          char: "💂",
          fitzpatrick_scale: true,
        },
        female_detective: {
          keywords: ["human", "spy", "detective", "female", "woman"],
          char: "🕵️‍♀️",
          fitzpatrick_scale: true,
        },
        male_detective: {
          keywords: ["human", "spy", "detective"],
          char: "🕵",
          fitzpatrick_scale: true,
        },
        woman_health_worker: {
          keywords: [
            "doctor",
            "nurse",
            "therapist",
            "healthcare",
            "woman",
            "human",
          ],
          char: "👩‍⚕️",
          fitzpatrick_scale: true,
        },
        man_health_worker: {
          keywords: [
            "doctor",
            "nurse",
            "therapist",
            "healthcare",
            "man",
            "human",
          ],
          char: "👨‍⚕️",
          fitzpatrick_scale: true,
        },
        woman_farmer: {
          keywords: ["rancher", "gardener", "woman", "human"],
          char: "👩‍🌾",
          fitzpatrick_scale: true,
        },
        man_farmer: {
          keywords: ["rancher", "gardener", "man", "human"],
          char: "👨‍🌾",
          fitzpatrick_scale: true,
        },
        woman_cook: {
          keywords: ["chef", "woman", "human"],
          char: "👩‍🍳",
          fitzpatrick_scale: true,
        },
        man_cook: {
          keywords: ["chef", "man", "human"],
          char: "👨‍🍳",
          fitzpatrick_scale: true,
        },
        woman_student: {
          keywords: ["graduate", "woman", "human"],
          char: "👩‍🎓",
          fitzpatrick_scale: true,
        },
        man_student: {
          keywords: ["graduate", "man", "human"],
          char: "👨‍🎓",
          fitzpatrick_scale: true,
        },
        woman_singer: {
          keywords: ["rockstar", "entertainer", "woman", "human"],
          char: "👩‍🎤",
          fitzpatrick_scale: true,
        },
        man_singer: {
          keywords: ["rockstar", "entertainer", "man", "human"],
          char: "👨‍🎤",
          fitzpatrick_scale: true,
        },
        woman_teacher: {
          keywords: ["instructor", "professor", "woman", "human"],
          char: "👩‍🏫",
          fitzpatrick_scale: true,
        },
        man_teacher: {
          keywords: ["instructor", "professor", "man", "human"],
          char: "👨‍🏫",
          fitzpatrick_scale: true,
        },
        woman_factory_worker: {
          keywords: ["assembly", "industrial", "woman", "human"],
          char: "👩‍🏭",
          fitzpatrick_scale: true,
        },
        man_factory_worker: {
          keywords: ["assembly", "industrial", "man", "human"],
          char: "👨‍🏭",
          fitzpatrick_scale: true,
        },
        woman_technologist: {
          keywords: [
            "coder",
            "developer",
            "engineer",
            "programmer",
            "software",
            "woman",
            "human",
            "laptop",
            "computer",
          ],
          char: "👩‍💻",
          fitzpatrick_scale: true,
        },
        man_technologist: {
          keywords: [
            "coder",
            "developer",
            "engineer",
            "programmer",
            "software",
            "man",
            "human",
            "laptop",
            "computer",
          ],
          char: "👨‍💻",
          fitzpatrick_scale: true,
        },
        woman_office_worker: {
          keywords: ["business", "manager", "woman", "human"],
          char: "👩‍💼",
          fitzpatrick_scale: true,
        },
        man_office_worker: {
          keywords: ["business", "manager", "man", "human"],
          char: "👨‍💼",
          fitzpatrick_scale: true,
        },
        woman_mechanic: {
          keywords: ["plumber", "woman", "human", "wrench"],
          char: "👩‍🔧",
          fitzpatrick_scale: true,
        },
        man_mechanic: {
          keywords: ["plumber", "man", "human", "wrench"],
          char: "👨‍🔧",
          fitzpatrick_scale: true,
        },
        woman_scientist: {
          keywords: [
            "biologist",
            "chemist",
            "engineer",
            "physicist",
            "woman",
            "human",
          ],
          char: "👩‍🔬",
          fitzpatrick_scale: true,
        },
        man_scientist: {
          keywords: [
            "biologist",
            "chemist",
            "engineer",
            "physicist",
            "man",
            "human",
          ],
          char: "👨‍🔬",
          fitzpatrick_scale: true,
        },
        woman_artist: {
          keywords: ["painter", "woman", "human"],
          char: "👩‍🎨",
          fitzpatrick_scale: true,
        },
        man_artist: {
          keywords: ["painter", "man", "human"],
          char: "👨‍🎨",
          fitzpatrick_scale: true,
        },
        woman_firefighter: {
          keywords: ["fireman", "woman", "human"],
          char: "👩‍🚒",
          fitzpatrick_scale: true,
        },
        man_firefighter: {
          keywords: ["fireman", "man", "human"],
          char: "👨‍🚒",
          fitzpatrick_scale: true,
        },
        woman_pilot: {
          keywords: ["aviator", "plane", "woman", "human"],
          char: "👩‍✈️",
          fitzpatrick_scale: true,
        },
        man_pilot: {
          keywords: ["aviator", "plane", "man", "human"],
          char: "👨‍✈️",
          fitzpatrick_scale: true,
        },
        woman_astronaut: {
          keywords: ["space", "rocket", "woman", "human"],
          char: "👩‍🚀",
          fitzpatrick_scale: true,
        },
        man_astronaut: {
          keywords: ["space", "rocket", "man", "human"],
          char: "👨‍🚀",
          fitzpatrick_scale: true,
        },
        woman_judge: {
          keywords: ["justice", "court", "woman", "human"],
          char: "👩‍⚖️",
          fitzpatrick_scale: true,
        },
        man_judge: {
          keywords: ["justice", "court", "man", "human"],
          char: "👨‍⚖️",
          fitzpatrick_scale: true,
        },
        woman_superhero: {
          keywords: ["woman", "female", "good", "heroine", "superpowers"],
          char: "🦸‍♀️",
          fitzpatrick_scale: true,
        },
        man_superhero: {
          keywords: ["man", "male", "good", "hero", "superpowers"],
          char: "🦸‍♂️",
          fitzpatrick_scale: true,
        },
        woman_supervillain: {
          keywords: [
            "woman",
            "female",
            "evil",
            "bad",
            "criminal",
            "heroine",
            "superpowers",
          ],
          char: "🦹‍♀️",
          fitzpatrick_scale: true,
        },
        man_supervillain: {
          keywords: [
            "man",
            "male",
            "evil",
            "bad",
            "criminal",
            "hero",
            "superpowers",
          ],
          char: "🦹‍♂️",
          fitzpatrick_scale: true,
        },
        mrs_claus: {
          keywords: ["woman", "female", "xmas", "mother christmas"],
          char: "🤶",
          fitzpatrick_scale: true,
        },
        santa: {
          keywords: ["festival", "man", "male", "xmas", "father christmas"],
          char: "🎅",
          fitzpatrick_scale: true,
        },
        sorceress: {
          keywords: ["woman", "female", "mage", "witch"],
          char: "🧙‍♀️",
          fitzpatrick_scale: true,
        },
        wizard: {
          keywords: ["man", "male", "mage", "sorcerer"],
          char: "🧙‍♂️",
          fitzpatrick_scale: true,
        },
        woman_elf: {
          keywords: ["woman", "female"],
          char: "🧝‍♀️",
          fitzpatrick_scale: true,
        },
        man_elf: {
          keywords: ["man", "male"],
          char: "🧝‍♂️",
          fitzpatrick_scale: true,
        },
        woman_vampire: {
          keywords: ["woman", "female"],
          char: "🧛‍♀️",
          fitzpatrick_scale: true,
        },
        man_vampire: {
          keywords: ["man", "male", "dracula"],
          char: "🧛‍♂️",
          fitzpatrick_scale: true,
        },
        woman_zombie: {
          keywords: ["woman", "female", "undead", "walking dead"],
          char: "🧟‍♀️",
        },
        man_zombie: {
          keywords: ["man", "male", "dracula", "undead", "walking dead"],
          char: "🧟‍♂️",
        },
        woman_genie: {
          keywords: ["woman", "female"],
          char: "🧞‍♀️",
        },
        man_genie: {
          keywords: ["man", "male"],
          char: "🧞‍♂️",
        },
        mermaid: {
          keywords: ["woman", "female", "merwoman", "ariel"],
          char: "🧜‍♀️",
          fitzpatrick_scale: true,
        },
        merman: {
          keywords: ["man", "male", "triton"],
          char: "🧜‍♂️",
          fitzpatrick_scale: true,
        },
        woman_fairy: {
          keywords: ["woman", "female"],
          char: "🧚‍♀️",
          fitzpatrick_scale: true,
        },
        man_fairy: {
          keywords: ["man", "male"],
          char: "🧚‍♂️",
          fitzpatrick_scale: true,
        },
        angel: {
          keywords: ["heaven", "wings", "halo"],
          char: "👼",
          fitzpatrick_scale: true,
        },
        pregnant_woman: {
          keywords: ["baby"],
          char: "🤰",
          fitzpatrick_scale: true,
        },
        breastfeeding: {
          keywords: ["nursing", "baby"],
          char: "🤱",
          fitzpatrick_scale: true,
        },
        princess: {
          keywords: [
            "girl",
            "woman",
            "female",
            "blond",
            "crown",
            "royal",
            "queen",
          ],
          char: "👸",
          fitzpatrick_scale: true,
        },
        prince: {
          keywords: ["boy", "man", "male", "crown", "royal", "king"],
          char: "🤴",
          fitzpatrick_scale: true,
        },
        bride_with_veil: {
          keywords: ["couple", "marriage", "wedding", "woman", "bride"],
          char: "👰",
          fitzpatrick_scale: true,
        },
        man_in_tuxedo: {
          keywords: ["couple", "marriage", "wedding", "groom"],
          char: "🤵",
          fitzpatrick_scale: true,
        },
        running_woman: {
          keywords: [
            "woman",
            "walking",
            "exercise",
            "race",
            "running",
            "female",
          ],
          char: "🏃‍♀️",
          fitzpatrick_scale: true,
        },
        running_man: {
          keywords: ["man", "walking", "exercise", "race", "running"],
          char: "🏃",
          fitzpatrick_scale: true,
        },
        walking_woman: {
          keywords: ["human", "feet", "steps", "woman", "female"],
          char: "🚶‍♀️",
          fitzpatrick_scale: true,
        },
        walking_man: {
          keywords: ["human", "feet", "steps"],
          char: "🚶",
          fitzpatrick_scale: true,
        },
        dancer: {
          keywords: ["female", "girl", "woman", "fun"],
          char: "💃",
          fitzpatrick_scale: true,
        },
        man_dancing: {
          keywords: ["male", "boy", "fun", "dancer"],
          char: "🕺",
          fitzpatrick_scale: true,
        },
        dancing_women: {
          keywords: ["female", "bunny", "women", "girls"],
          char: "👯",
        },
        dancing_men: {
          keywords: ["male", "bunny", "men", "boys"],
          char: "👯‍♂️",
        },
        couple: {
          keywords: [
            "pair",
            "people",
            "human",
            "love",
            "date",
            "dating",
            "like",
            "affection",
            "valentines",
            "marriage",
          ],
          char: "👫",
        },
        two_men_holding_hands: {
          keywords: [
            "pair",
            "couple",
            "love",
            "like",
            "bromance",
            "friendship",
            "people",
            "human",
          ],
          char: "👬",
        },
        two_women_holding_hands: {
          keywords: [
            "pair",
            "friendship",
            "couple",
            "love",
            "like",
            "female",
            "people",
            "human",
          ],
          char: "👭",
        },
        bowing_woman: {
          keywords: ["woman", "female", "girl"],
          char: "🙇‍♀️",
          fitzpatrick_scale: true,
        },
        bowing_man: {
          keywords: ["man", "male", "boy"],
          char: "🙇",
          fitzpatrick_scale: true,
        },
        man_facepalming: {
          keywords: ["man", "male", "boy", "disbelief"],
          char: "🤦‍♂️",
          fitzpatrick_scale: true,
        },
        woman_facepalming: {
          keywords: ["woman", "female", "girl", "disbelief"],
          char: "🤦‍♀️",
          fitzpatrick_scale: true,
        },
        woman_shrugging: {
          keywords: [
            "woman",
            "female",
            "girl",
            "confused",
            "indifferent",
            "doubt",
          ],
          char: "🤷",
          fitzpatrick_scale: true,
        },
        man_shrugging: {
          keywords: ["man", "male", "boy", "confused", "indifferent", "doubt"],
          char: "🤷‍♂️",
          fitzpatrick_scale: true,
        },
        tipping_hand_woman: {
          keywords: ["female", "girl", "woman", "human", "information"],
          char: "💁",
          fitzpatrick_scale: true,
        },
        tipping_hand_man: {
          keywords: ["male", "boy", "man", "human", "information"],
          char: "💁‍♂️",
          fitzpatrick_scale: true,
        },
        no_good_woman: {
          keywords: ["female", "girl", "woman", "nope"],
          char: "🙅",
          fitzpatrick_scale: true,
        },
        no_good_man: {
          keywords: ["male", "boy", "man", "nope"],
          char: "🙅‍♂️",
          fitzpatrick_scale: true,
        },
        ok_woman: {
          keywords: ["women", "girl", "female", "pink", "human", "woman"],
          char: "🙆",
          fitzpatrick_scale: true,
        },
        ok_man: {
          keywords: ["men", "boy", "male", "blue", "human", "man"],
          char: "🙆‍♂️",
          fitzpatrick_scale: true,
        },
        raising_hand_woman: {
          keywords: ["female", "girl", "woman"],
          char: "🙋",
          fitzpatrick_scale: true,
        },
        raising_hand_man: {
          keywords: ["male", "boy", "man"],
          char: "🙋‍♂️",
          fitzpatrick_scale: true,
        },
        pouting_woman: {
          keywords: ["female", "girl", "woman"],
          char: "🙎",
          fitzpatrick_scale: true,
        },
        pouting_man: {
          keywords: ["male", "boy", "man"],
          char: "🙎‍♂️",
          fitzpatrick_scale: true,
        },
        frowning_woman: {
          keywords: [
            "female",
            "girl",
            "woman",
            "sad",
            "depressed",
            "discouraged",
            "unhappy",
          ],
          char: "🙍",
          fitzpatrick_scale: true,
        },
        frowning_man: {
          keywords: [
            "male",
            "boy",
            "man",
            "sad",
            "depressed",
            "discouraged",
            "unhappy",
          ],
          char: "🙍‍♂️",
          fitzpatrick_scale: true,
        },
        haircut_woman: {
          keywords: ["female", "girl", "woman"],
          char: "💇",
          fitzpatrick_scale: true,
        },
        haircut_man: {
          keywords: ["male", "boy", "man"],
          char: "💇‍♂️",
          fitzpatrick_scale: true,
        },
        massage_woman: {
          keywords: ["female", "girl", "woman", "head"],
          char: "💆",
          fitzpatrick_scale: true,
        },
        massage_man: {
          keywords: ["male", "boy", "man", "head"],
          char: "💆‍♂️",
          fitzpatrick_scale: true,
        },
        woman_in_steamy_room: {
          keywords: ["female", "woman", "spa", "steamroom", "sauna"],
          char: "🧖‍♀️",
          fitzpatrick_scale: true,
        },
        man_in_steamy_room: {
          keywords: ["male", "man", "spa", "steamroom", "sauna"],
          char: "🧖‍♂️",
          fitzpatrick_scale: true,
        },
        couple_with_heart_woman_man: {
          keywords: [
            "pair",
            "love",
            "like",
            "affection",
            "human",
            "dating",
            "valentines",
            "marriage",
          ],
          char: "💑",
        },
        couple_with_heart_woman_woman: {
          keywords: [
            "pair",
            "love",
            "like",
            "affection",
            "human",
            "dating",
            "valentines",
            "marriage",
          ],
          char: "👩‍❤️‍👩",
        },
        couple_with_heart_man_man: {
          keywords: [
            "pair",
            "love",
            "like",
            "affection",
            "human",
            "dating",
            "valentines",
            "marriage",
          ],
          char: "👨‍❤️‍👨",
        },
        couplekiss_man_woman: {
          keywords: [
            "pair",
            "valentines",
            "love",
            "like",
            "dating",
            "marriage",
          ],
          char: "💏",
        },
        couplekiss_woman_woman: {
          keywords: [
            "pair",
            "valentines",
            "love",
            "like",
            "dating",
            "marriage",
          ],
          char: "👩‍❤️‍💋‍👩",
        },
        couplekiss_man_man: {
          keywords: [
            "pair",
            "valentines",
            "love",
            "like",
            "dating",
            "marriage",
          ],
          char: "👨‍❤️‍💋‍👨",
        },
        family_man_woman_boy: {
          keywords: [
            "home",
            "parents",
            "child",
            "mom",
            "dad",
            "father",
            "mother",
            "people",
            "human",
          ],
          char: "👪",
        },
        family_man_woman_girl: {
          keywords: ["home", "parents", "people", "human", "child"],
          char: "👨‍👩‍👧",
        },
        family_man_woman_girl_boy: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👨‍👩‍👧‍👦",
        },
        family_man_woman_boy_boy: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👨‍👩‍👦‍👦",
        },
        family_man_woman_girl_girl: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👨‍👩‍👧‍👧",
        },
        family_woman_woman_boy: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👩‍👩‍👦",
        },
        family_woman_woman_girl: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👩‍👩‍👧",
        },
        family_woman_woman_girl_boy: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👩‍👩‍👧‍👦",
        },
        family_woman_woman_boy_boy: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👩‍👩‍👦‍👦",
        },
        family_woman_woman_girl_girl: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👩‍👩‍👧‍👧",
        },
        family_man_man_boy: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👨‍👨‍👦",
        },
        family_man_man_girl: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👨‍👨‍👧",
        },
        family_man_man_girl_boy: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👨‍👨‍👧‍👦",
        },
        family_man_man_boy_boy: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👨‍👨‍👦‍👦",
        },
        family_man_man_girl_girl: {
          keywords: ["home", "parents", "people", "human", "children"],
          char: "👨‍👨‍👧‍👧",
        },
        family_woman_boy: {
          keywords: ["home", "parent", "people", "human", "child"],
          char: "👩‍👦",
        },
        family_woman_girl: {
          keywords: ["home", "parent", "people", "human", "child"],
          char: "👩‍👧",
        },
        family_woman_girl_boy: {
          keywords: ["home", "parent", "people", "human", "children"],
          char: "👩‍👧‍👦",
        },
        family_woman_boy_boy: {
          keywords: ["home", "parent", "people", "human", "children"],
          char: "👩‍👦‍👦",
        },
        family_woman_girl_girl: {
          keywords: ["home", "parent", "people", "human", "children"],
          char: "👩‍👧‍👧",
        },
        family_man_boy: {
          keywords: ["home", "parent", "people", "human", "child"],
          char: "👨‍👦",
        },
        family_man_girl: {
          keywords: ["home", "parent", "people", "human", "child"],
          char: "👨‍👧",
        },
        family_man_girl_boy: {
          keywords: ["home", "parent", "people", "human", "children"],
          char: "👨‍👧‍👦",
        },
        family_man_boy_boy: {
          keywords: ["home", "parent", "people", "human", "children"],
          char: "👨‍👦‍👦",
        },
        family_man_girl_girl: {
          keywords: ["home", "parent", "people", "human", "children"],
          char: "👨‍👧‍👧",
        },
        yarn: {
          keywords: ["ball", "crochet", "knit"],
          char: "🧶",
        },
        thread: {
          keywords: ["needle", "sewing", "spool", "string"],
          char: "🧵",
        },
        coat: {
          keywords: ["jacket"],
          char: "🧥",
        },
        labcoat: {
          keywords: ["doctor", "experiment", "scientist", "chemist"],
          char: "🥼",
        },
        womans_clothes: {
          keywords: ["fashion", "shopping_bags", "female"],
          char: "👚",
        },
        tshirt: {
          keywords: ["fashion", "cloth", "casual", "shirt", "tee"],
          char: "👕",
        },
        jeans: {
          keywords: ["fashion", "shopping"],
          char: "👖",
        },
        necktie: {
          keywords: [
            "shirt",
            "suitup",
            "formal",
            "fashion",
            "cloth",
            "business",
          ],
          char: "👔",
        },
        dress: {
          keywords: ["clothes", "fashion", "shopping"],
          char: "👗",
        },
        bikini: {
          keywords: [
            "swimming",
            "female",
            "woman",
            "girl",
            "fashion",
            "beach",
            "summer",
          ],
          char: "👙",
        },
        kimono: {
          keywords: ["dress", "fashion", "women", "female", "japanese"],
          char: "👘",
        },
        lipstick: {
          keywords: ["female", "girl", "fashion", "woman"],
          char: "💄",
        },
        kiss: {
          keywords: ["face", "lips", "love", "like", "affection", "valentines"],
          char: "💋",
        },
        footprints: {
          keywords: ["feet", "tracking", "walking", "beach"],
          char: "👣",
        },
        flat_shoe: {
          keywords: ["ballet", "slip-on", "slipper"],
          char: "🥿",
        },
        high_heel: {
          keywords: ["fashion", "shoes", "female", "pumps", "stiletto"],
          char: "👠",
        },
        sandal: {
          keywords: ["shoes", "fashion", "flip flops"],
          char: "👡",
        },
        boot: {
          keywords: ["shoes", "fashion"],
          char: "👢",
        },
        mans_shoe: {
          keywords: ["fashion", "male"],
          char: "👞",
        },
        athletic_shoe: {
          keywords: ["shoes", "sports", "sneakers"],
          char: "👟",
        },
        hiking_boot: {
          keywords: ["backpacking", "camping", "hiking"],
          char: "🥾",
        },
        socks: {
          keywords: ["stockings", "clothes"],
          char: "🧦",
        },
        gloves: {
          keywords: ["hands", "winter", "clothes"],
          char: "🧤",
        },
        scarf: {
          keywords: ["neck", "winter", "clothes"],
          char: "🧣",
        },
        womans_hat: {
          keywords: ["fashion", "accessories", "female", "lady", "spring"],
          char: "👒",
        },
        tophat: {
          keywords: ["magic", "gentleman", "classy", "circus"],
          char: "🎩",
        },
        billed_hat: {
          keywords: ["cap", "baseball"],
          char: "🧢",
        },
        rescue_worker_helmet: {
          keywords: ["construction", "build"],
          char: "⛑",
        },
        mortar_board: {
          keywords: [
            "school",
            "college",
            "degree",
            "university",
            "graduation",
            "cap",
            "hat",
            "legal",
            "learn",
            "education",
          ],
          char: "🎓",
        },
        crown: {
          keywords: ["king", "kod", "leader", "royalty", "lord"],
          char: "👑",
        },
        school_satchel: {
          keywords: ["student", "education", "bag", "backpack"],
          char: "🎒",
        },
        luggage: {
          keywords: ["packing", "travel"],
          char: "🧳",
        },
        pouch: {
          keywords: ["bag", "accessories", "shopping"],
          char: "👝",
        },
        purse: {
          keywords: ["fashion", "accessories", "money", "sales", "shopping"],
          char: "👛",
        },
        handbag: {
          keywords: ["fashion", "accessory", "accessories", "shopping"],
          char: "👜",
        },
        briefcase: {
          keywords: [
            "business",
            "documents",
            "work",
            "law",
            "legal",
            "job",
            "career",
          ],
          char: "💼",
        },
        eyeglasses: {
          keywords: [
            "fashion",
            "accessories",
            "eyesight",
            "nerdy",
            "dork",
            "geek",
          ],
          char: "👓",
        },
        dark_sunglasses: {
          keywords: ["face", "cool", "accessories"],
          char: "🕶",
        },
        goggles: {
          keywords: ["eyes", "protection", "safety"],
          char: "🥽",
        },
        ring: {
          keywords: [
            "wedding",
            "propose",
            "marriage",
            "valentines",
            "diamond",
            "fashion",
            "jewelry",
            "gem",
            "engagement",
          ],
          char: "💍",
        },
        closed_umbrella: {
          keywords: ["weather", "rain", "drizzle"],
          char: "🌂",
        },
      },
    },
  },

  {
    animals: {
      id: "animals_and_nature",
      name: "Animals & Nature",
      symbol: Animals,
      emojis: {
        dog: {
          keywords: [
            "animal",
            "friend",
            "nature",
            "woof",
            "puppy",
            "pet",
            "faithful",
          ],
          char: "🐶",
        },
        cat: {
          keywords: ["animal", "meow", "nature", "pet", "kitten"],
          char: "🐱",
        },
        mouse: {
          keywords: ["animal", "nature", "cheese_wedge", "rodent"],
          char: "🐭",
        },
        hamster: {
          keywords: ["animal", "nature"],
          char: "🐹",
        },
        rabbit: {
          keywords: ["animal", "nature", "pet", "spring", "magic", "bunny"],
          char: "🐰",
        },
        fox_face: {
          keywords: ["animal", "nature", "face"],
          char: "🦊",
        },
        bear: {
          keywords: ["animal", "nature", "wild"],
          char: "🐻",
        },
        panda_face: {
          keywords: ["animal", "nature", "panda"],
          char: "🐼",
        },
        koala: {
          keywords: ["animal", "nature"],
          char: "🐨",
        },
        tiger: {
          keywords: ["animal", "cat", "danger", "wild", "nature", "roar"],
          char: "🐯",
        },
        lion: {
          keywords: ["animal", "nature"],
          char: "🦁",
        },
        cow: {
          keywords: ["beef", "ox", "animal", "nature", "moo", "milk"],
          char: "🐮",
        },
        pig: {
          keywords: ["animal", "oink", "nature"],
          char: "🐷",
        },
        pig_nose: {
          keywords: ["animal", "oink"],
          char: "🐽",
        },
        frog: {
          keywords: ["animal", "nature", "croak", "toad"],
          char: "🐸",
        },
        squid: {
          keywords: ["animal", "nature", "ocean", "sea"],
          char: "🦑",
        },
        octopus: {
          keywords: ["animal", "creature", "ocean", "sea", "nature", "beach"],
          char: "🐙",
        },
        shrimp: {
          keywords: ["animal", "ocean", "nature", "seafood"],
          char: "🦐",
        },
        monkey_face: {
          keywords: ["animal", "nature", "circus"],
          char: "🐵",
        },
        gorilla: {
          keywords: ["animal", "nature", "circus"],
          char: "🦍",
        },
        see_no_evil: {
          keywords: ["monkey", "animal", "nature", "haha"],
          char: "🙈",
        },
        hear_no_evil: {
          keywords: ["animal", "monkey", "nature"],
          char: "🙉",
        },
        speak_no_evil: {
          keywords: ["monkey", "animal", "nature", "omg"],
          char: "🙊",
        },
        monkey: {
          keywords: ["animal", "nature", "banana", "circus"],
          char: "🐒",
        },
        chicken: {
          keywords: ["animal", "cluck", "nature", "bird"],
          char: "🐔",
        },
        penguin: {
          keywords: ["animal", "nature"],
          char: "🐧",
        },
        bird: {
          keywords: ["animal", "nature", "fly", "tweet", "spring"],
          char: "🐦",
        },
        baby_chick: {
          keywords: ["animal", "chicken", "bird"],
          char: "🐤",
        },
        hatching_chick: {
          keywords: ["animal", "chicken", "egg", "born", "baby", "bird"],
          char: "🐣",
        },
        hatched_chick: {
          keywords: ["animal", "chicken", "baby", "bird"],
          char: "🐥",
        },
        duck: {
          keywords: ["animal", "nature", "bird", "mallard"],
          char: "🦆",
        },
        eagle: {
          keywords: ["animal", "nature", "bird"],
          char: "🦅",
        },
        owl: {
          keywords: ["animal", "nature", "bird", "hoot"],
          char: "🦉",
        },
        bat: {
          keywords: ["animal", "nature", "blind", "vampire"],
          char: "🦇",
        },
        wolf: {
          keywords: ["animal", "nature", "wild"],
          char: "🐺",
        },
        boar: {
          keywords: ["animal", "nature"],
          char: "🐗",
        },
        horse: {
          keywords: ["animal", "brown", "nature"],
          char: "🐴",
        },
        unicorn: {
          keywords: ["animal", "nature", "mystical"],
          char: "🦄",
        },
        honeybee: {
          keywords: ["animal", "insect", "nature", "bug", "spring", "honey"],
          char: "🐝",
        },
        bug: {
          keywords: ["animal", "insect", "nature", "worm"],
          char: "🐛",
        },
        butterfly: {
          keywords: ["animal", "insect", "nature", "caterpillar"],
          char: "🦋",
        },
        snail: {
          keywords: ["slow", "animal", "shell"],
          char: "🐌",
        },
        beetle: {
          keywords: ["animal", "insect", "nature", "ladybug"],
          char: "🐞",
        },
        ant: {
          keywords: ["animal", "insect", "nature", "bug"],
          char: "🐜",
        },
        grasshopper: {
          keywords: ["animal", "cricket", "chirp"],
          char: "🦗",
        },
        spider: {
          keywords: ["animal", "arachnid"],
          char: "🕷",
        },
        scorpion: {
          keywords: ["animal", "arachnid"],
          char: "🦂",
        },
        crab: {
          keywords: ["animal", "crustacean"],
          char: "🦀",
        },
        snake: {
          keywords: ["animal", "evil", "nature", "hiss", "python"],
          char: "🐍",
        },
        lizard: {
          keywords: ["animal", "nature", "reptile"],
          char: "🦎",
        },
        "t-rex": {
          keywords: [
            "animal",
            "nature",
            "dinosaur",
            "tyrannosaurus",
            "extinct",
          ],
          char: "🦖",
        },
        sauropod: {
          keywords: [
            "animal",
            "nature",
            "dinosaur",
            "brachiosaurus",
            "brontosaurus",
            "diplodocus",
            "extinct",
          ],
          char: "🦕",
        },
        turtle: {
          keywords: ["animal", "slow", "nature", "tortoise"],
          char: "🐢",
        },
        tropical_fish: {
          keywords: ["animal", "swim", "ocean", "beach", "nemo"],
          char: "🐠",
        },
        fish: {
          keywords: ["animal", "food", "nature"],
          char: "🐟",
        },
        blowfish: {
          keywords: ["animal", "nature", "food", "sea", "ocean"],
          char: "🐡",
        },
        dolphin: {
          keywords: [
            "animal",
            "nature",
            "fish",
            "sea",
            "ocean",
            "flipper",
            "fins",
            "beach",
          ],
          char: "🐬",
        },
        shark: {
          keywords: [
            "animal",
            "nature",
            "fish",
            "sea",
            "ocean",
            "jaws",
            "fins",
            "beach",
          ],
          char: "🦈",
        },
        whale: {
          keywords: ["animal", "nature", "sea", "ocean"],
          char: "🐳",
        },
        whale2: {
          keywords: ["animal", "nature", "sea", "ocean"],
          char: "🐋",
        },
        crocodile: {
          keywords: ["animal", "nature", "reptile", "lizard", "alligator"],
          char: "🐊",
        },
        leopard: {
          keywords: ["animal", "nature"],
          char: "🐆",
        },
        zebra: {
          keywords: ["animal", "nature", "stripes", "safari"],
          char: "🦓",
        },
        tiger2: {
          keywords: ["animal", "nature", "roar"],
          char: "🐅",
        },
        water_buffalo: {
          keywords: ["animal", "nature", "ox", "cow"],
          char: "🐃",
        },
        ox: {
          keywords: ["animal", "cow", "beef"],
          char: "🐂",
        },
        cow2: {
          keywords: ["beef", "ox", "animal", "nature", "moo", "milk"],
          char: "🐄",
        },
        deer: {
          keywords: ["animal", "nature", "horns", "venison"],
          char: "🦌",
        },
        dromedary_camel: {
          keywords: ["animal", "hot", "desert", "hump"],
          char: "🐪",
        },
        camel: {
          keywords: ["animal", "nature", "hot", "desert", "hump"],
          char: "🐫",
        },
        giraffe: {
          keywords: ["animal", "nature", "spots", "safari"],
          char: "🦒",
        },
        elephant: {
          keywords: ["animal", "nature", "nose", "th", "circus"],
          char: "🐘",
        },
        rhinoceros: {
          keywords: ["animal", "nature", "horn"],
          char: "🦏",
        },
        goat: {
          keywords: ["animal", "nature"],
          char: "🐐",
        },
        ram: {
          keywords: ["animal", "sheep", "nature"],
          char: "🐏",
        },
        sheep: {
          keywords: ["animal", "nature", "wool", "shipit"],
          char: "🐑",
        },
        racehorse: {
          keywords: ["animal", "gamble", "luck"],
          char: "🐎",
        },
        pig2: {
          keywords: ["animal", "nature"],
          char: "🐖",
        },
        rat: {
          keywords: ["animal", "mouse", "rodent"],
          char: "🐀",
        },
        mouse2: {
          keywords: ["animal", "nature", "rodent"],
          char: "🐁",
        },
        rooster: {
          keywords: ["animal", "nature", "chicken"],
          char: "🐓",
        },
        turkey: {
          keywords: ["animal", "bird"],
          char: "🦃",
        },
        dove: {
          keywords: ["animal", "bird"],
          char: "🕊",
        },
        dog2: {
          keywords: ["animal", "nature", "friend", "doge", "pet", "faithful"],
          char: "🐕",
        },
        poodle: {
          keywords: ["dog", "animal", "101", "nature", "pet"],
          char: "🐩",
        },
        cat2: {
          keywords: ["animal", "meow", "pet", "cats"],
          char: "🐈",
        },
        rabbit2: {
          keywords: ["animal", "nature", "pet", "magic", "spring"],
          char: "🐇",
        },
        chipmunk: {
          keywords: ["animal", "nature", "rodent", "squirrel"],
          char: "🐿",
        },
        hedgehog: {
          keywords: ["animal", "nature", "spiny"],
          char: "🦔",
        },
        raccoon: {
          keywords: ["animal", "nature"],
          char: "🦝",
        },
        llama: {
          keywords: ["animal", "nature", "alpaca"],
          char: "🦙",
        },
        hippopotamus: {
          keywords: ["animal", "nature"],
          char: "🦛",
        },
        kangaroo: {
          keywords: [
            "animal",
            "nature",
            "australia",
            "joey",
            "hop",
            "marsupial",
          ],
          char: "🦘",
        },
        badger: {
          keywords: ["animal", "nature", "honey"],
          char: "🦡",
        },
        swan: {
          keywords: ["animal", "nature", "bird"],
          char: "🦢",
        },
        peacock: {
          keywords: ["animal", "nature", "peahen", "bird"],
          char: "🦚",
        },
        parrot: {
          keywords: ["animal", "nature", "bird", "pirate", "talk"],
          char: "🦜",
        },
        lobster: {
          keywords: ["animal", "nature", "bisque", "claws", "seafood"],
          char: "🦞",
        },
        mosquito: {
          keywords: ["animal", "nature", "insect", "malaria"],
          char: "🦟",
        },
        paw_prints: {
          keywords: [
            "animal",
            "tracking",
            "footprints",
            "dog",
            "cat",
            "pet",
            "feet",
          ],
          char: "🐾",
        },
        dragon: {
          keywords: ["animal", "myth", "nature", "chinese", "green"],
          char: "🐉",
        },
        dragon_face: {
          keywords: ["animal", "myth", "nature", "chinese", "green"],
          char: "🐲",
        },
        cactus: {
          keywords: ["vegetable", "plant", "nature"],
          char: "🌵",
        },
        christmas_tree: {
          keywords: ["festival", "vacation", "december", "xmas", "celebration"],
          char: "🎄",
        },
        evergreen_tree: {
          keywords: ["plant", "nature"],
          char: "🌲",
        },
        deciduous_tree: {
          keywords: ["plant", "nature"],
          char: "🌳",
        },
        palm_tree: {
          keywords: [
            "plant",
            "vegetable",
            "nature",
            "summer",
            "beach",
            "mojito",
            "tropical",
          ],
          char: "🌴",
        },
        seedling: {
          keywords: ["plant", "nature", "grass", "lawn", "spring"],
          char: "🌱",
        },
        herb: {
          keywords: ["vegetable", "plant", "medicine", "weed", "grass", "lawn"],
          char: "🌿",
        },
        shamrock: {
          keywords: ["vegetable", "plant", "nature", "irish", "clover"],
          char: "☘",
        },
        four_leaf_clover: {
          keywords: ["vegetable", "plant", "nature", "lucky", "irish"],
          char: "🍀",
        },
        bamboo: {
          keywords: [
            "plant",
            "nature",
            "vegetable",
            "panda",
            "pine_decoration",
          ],
          char: "🎍",
        },
        tanabata_tree: {
          keywords: ["plant", "nature", "branch", "summer"],
          char: "🎋",
        },
        leaves: {
          keywords: [
            "nature",
            "plant",
            "tree",
            "vegetable",
            "grass",
            "lawn",
            "spring",
          ],
          char: "🍃",
        },
        fallen_leaf: {
          keywords: ["nature", "plant", "vegetable", "leaves"],
          char: "🍂",
        },
        maple_leaf: {
          keywords: ["nature", "plant", "vegetable", "ca", "fall"],
          char: "🍁",
        },
        ear_of_rice: {
          keywords: ["nature", "plant"],
          char: "🌾",
        },
        hibiscus: {
          keywords: ["plant", "vegetable", "flowers", "beach"],
          char: "🌺",
        },
        sunflower: {
          keywords: ["nature", "plant", "fall"],
          char: "🌻",
        },
        rose: {
          keywords: ["flowers", "valentines", "love", "spring"],
          char: "🌹",
        },
        wilted_flower: {
          keywords: ["plant", "nature", "flower"],
          char: "🥀",
        },
        tulip: {
          keywords: ["flowers", "plant", "nature", "summer", "spring"],
          char: "🌷",
        },
        blossom: {
          keywords: ["nature", "flowers", "yellow"],
          char: "🌼",
        },
        cherry_blossom: {
          keywords: ["nature", "plant", "spring", "flower"],
          char: "🌸",
        },
        bouquet: {
          keywords: ["flowers", "nature", "spring"],
          char: "💐",
        },
        mushroom: {
          keywords: ["plant", "vegetable"],
          char: "🍄",
        },
        chestnut: {
          keywords: ["food", "squirrel"],
          char: "🌰",
        },
        jack_o_lantern: {
          keywords: ["halloween", "light", "pumpkin", "creepy", "fall"],
          char: "🎃",
        },
        shell: {
          keywords: ["nature", "sea", "beach"],
          char: "🐚",
        },
        spider_web: {
          keywords: ["animal", "insect", "arachnid", "silk"],
          char: "🕸",
        },
        earth_americas: {
          keywords: ["globe", "world", "USA", "international"],
          char: "🌎",
        },
        earth_africa: {
          keywords: ["globe", "world", "international"],
          char: "🌍",
        },
        earth_asia: {
          keywords: ["globe", "world", "east", "international"],
          char: "🌏",
        },
        full_moon: {
          keywords: [
            "nature",
            "yellow",
            "twilight",
            "planet",
            "space",
            "night",
            "evening",
            "sleep",
          ],
          char: "🌕",
        },
        waning_gibbous_moon: {
          keywords: [
            "nature",
            "twilight",
            "planet",
            "space",
            "night",
            "evening",
            "sleep",
            "waxing_gibbous_moon",
          ],
          char: "🌖",
        },
        last_quarter_moon: {
          keywords: [
            "nature",
            "twilight",
            "planet",
            "space",
            "night",
            "evening",
            "sleep",
          ],
          char: "🌗",
        },
        waning_crescent_moon: {
          keywords: [
            "nature",
            "twilight",
            "planet",
            "space",
            "night",
            "evening",
            "sleep",
          ],
          char: "🌘",
        },
        new_moon: {
          keywords: [
            "nature",
            "twilight",
            "planet",
            "space",
            "night",
            "evening",
            "sleep",
          ],
          char: "🌑",
        },
        waxing_crescent_moon: {
          keywords: [
            "nature",
            "twilight",
            "planet",
            "space",
            "night",
            "evening",
            "sleep",
          ],
          char: "🌒",
        },
        first_quarter_moon: {
          keywords: [
            "nature",
            "twilight",
            "planet",
            "space",
            "night",
            "evening",
            "sleep",
          ],
          char: "🌓",
        },
        waxing_gibbous_moon: {
          keywords: [
            "nature",
            "night",
            "sky",
            "gray",
            "twilight",
            "planet",
            "space",
            "evening",
            "sleep",
          ],
          char: "🌔",
        },
        new_moon_with_face: {
          keywords: [
            "nature",
            "twilight",
            "planet",
            "space",
            "night",
            "evening",
            "sleep",
          ],
          char: "🌚",
        },
        full_moon_with_face: {
          keywords: [
            "nature",
            "twilight",
            "planet",
            "space",
            "night",
            "evening",
            "sleep",
          ],
          char: "🌝",
        },
        first_quarter_moon_with_face: {
          keywords: [
            "nature",
            "twilight",
            "planet",
            "space",
            "night",
            "evening",
            "sleep",
          ],
          char: "🌛",
        },
        last_quarter_moon_with_face: {
          keywords: [
            "nature",
            "twilight",
            "planet",
            "space",
            "night",
            "evening",
            "sleep",
          ],
          char: "🌜",
        },
        sun_with_face: {
          keywords: ["nature", "morning", "sky"],
          char: "🌞",
        },
        crescent_moon: {
          keywords: ["night", "sleep", "sky", "evening", "magic"],
          char: "🌙",
        },
        star: {
          keywords: ["night", "yellow"],
          char: "⭐",
        },
        star2: {
          keywords: ["night", "sparkle", "awesome", "good", "magic"],
          char: "🌟",
        },
        dizzy: {
          keywords: ["star", "sparkle", "shoot", "magic"],
          char: "💫",
        },
        sparkles: {
          keywords: [
            "stars",
            "shine",
            "shiny",
            "cool",
            "awesome",
            "good",
            "magic",
          ],
          char: "✨",
        },
        comet: {
          keywords: ["space"],
          char: "☄",
        },
        sunny: {
          keywords: [
            "weather",
            "nature",
            "brightness",
            "summer",
            "beach",
            "spring",
          ],
          char: "☀️",
        },
        sun_behind_small_cloud: {
          keywords: ["weather"],
          char: "🌤",
        },
        partly_sunny: {
          keywords: [
            "weather",
            "nature",
            "cloudy",
            "morning",
            "fall",
            "spring",
          ],
          char: "⛅",
        },
        sun_behind_large_cloud: {
          keywords: ["weather"],
          char: "🌥",
        },
        sun_behind_rain_cloud: {
          keywords: ["weather"],
          char: "🌦",
        },
        cloud: {
          keywords: ["weather", "sky"],
          char: "☁️",
        },
        cloud_with_rain: {
          keywords: ["weather"],
          char: "🌧",
        },
        cloud_with_lightning_and_rain: {
          keywords: ["weather", "lightning"],
          char: "⛈",
        },
        cloud_with_lightning: {
          keywords: ["weather", "thunder"],
          char: "🌩",
        },
        zap: {
          keywords: ["thunder", "weather", "lightning bolt", "fast"],
          char: "⚡",
        },
        fire: {
          keywords: ["hot", "cook", "flame"],
          char: "🔥",
        },
        boom: {
          keywords: ["bomb", "explode", "explosion", "collision", "blown"],
          char: "💥",
        },
        snowflake: {
          keywords: [
            "winter",
            "season",
            "cold",
            "weather",
            "christmas",
            "xmas",
          ],
          char: "❄️",
        },
        cloud_with_snow: {
          keywords: ["weather"],
          char: "🌨",
        },
        snowman: {
          keywords: [
            "winter",
            "season",
            "cold",
            "weather",
            "christmas",
            "xmas",
            "frozen",
            "without_snow",
          ],
          char: "⛄",
        },
        snowman_with_snow: {
          keywords: [
            "winter",
            "season",
            "cold",
            "weather",
            "christmas",
            "xmas",
            "frozen",
          ],
          char: "☃",
        },
        wind_face: {
          keywords: ["gust", "air"],
          char: "🌬",
        },
        dash: {
          keywords: ["wind", "air", "fast", "shoo", "fart", "smoke", "puff"],
          char: "💨",
        },
        tornado: {
          keywords: ["weather", "cyclone", "twister"],
          char: "🌪",
        },
        fog: {
          keywords: ["weather"],
          char: "🌫",
        },
        open_umbrella: {
          keywords: ["weather", "spring"],
          char: "☂",
        },
        umbrella: {
          keywords: ["rainy", "weather", "spring"],
          char: "☔",
        },
        droplet: {
          keywords: ["water", "drip", "faucet", "spring"],
          char: "💧",
        },
        sweat_drops: {
          keywords: ["water", "drip", "oops"],
          char: "💦",
        },
        ocean: {
          keywords: ["sea", "water", "wave", "nature", "tsunami", "disaster"],
          char: "🌊",
        },
      },
    },
  },

  {
    food: {
      id: "food_and_drink",
      name: "Food & Drink",
      symbol: Food,
      emojis: {
        green_apple: {
          keywords: ["fruit", "nature"],
          char: "🍏",
        },
        apple: {
          keywords: ["fruit", "mac", "school"],
          char: "🍎",
        },
        pear: {
          keywords: ["fruit", "nature", "food"],
          char: "🍐",
        },
        tangerine: {
          keywords: ["food", "fruit", "nature", "orange"],
          char: "🍊",
        },
        lemon: {
          keywords: ["fruit", "nature"],
          char: "🍋",
        },
        banana: {
          keywords: ["fruit", "food", "monkey"],
          char: "🍌",
        },
        watermelon: {
          keywords: ["fruit", "food", "picnic", "summer"],
          char: "🍉",
        },
        grapes: {
          keywords: ["fruit", "food", "wine"],
          char: "🍇",
        },
        strawberry: {
          keywords: ["fruit", "food", "nature"],
          char: "🍓",
        },
        melon: {
          keywords: ["fruit", "nature", "food"],
          char: "🍈",
        },
        cherries: {
          keywords: ["food", "fruit"],
          char: "🍒",
        },
        peach: {
          keywords: ["fruit", "nature", "food"],
          char: "🍑",
        },
        pineapple: {
          keywords: ["fruit", "nature", "food"],
          char: "🍍",
        },
        coconut: {
          keywords: ["fruit", "nature", "food", "palm"],
          char: "🥥",
        },
        kiwi_fruit: {
          keywords: ["fruit", "food"],
          char: "🥝",
        },
        mango: {
          keywords: ["fruit", "food", "tropical"],
          char: "🥭",
        },
        avocado: {
          keywords: ["fruit", "food"],
          char: "🥑",
        },
        broccoli: {
          keywords: ["fruit", "food", "vegetable"],
          char: "🥦",
        },
        tomato: {
          keywords: ["fruit", "vegetable", "nature", "food"],
          char: "🍅",
        },
        eggplant: {
          keywords: ["vegetable", "nature", "food", "aubergine"],
          char: "🍆",
        },
        cucumber: {
          keywords: ["fruit", "food", "pickle"],
          char: "🥒",
        },
        carrot: {
          keywords: ["vegetable", "food", "orange"],
          char: "🥕",
        },
        hot_pepper: {
          keywords: ["food", "spicy", "chilli", "chili"],
          char: "🌶",
        },
        potato: {
          keywords: ["food", "tuber", "vegatable", "starch"],
          char: "🥔",
        },
        corn: {
          keywords: ["food", "vegetable", "plant"],
          char: "🌽",
        },
        leafy_greens: {
          keywords: [
            "food",
            "vegetable",
            "plant",
            "bok choy",
            "cabbage",
            "kale",
            "lettuce",
          ],
          char: "🥬",
        },
        sweet_potato: {
          keywords: ["food", "nature"],
          char: "🍠",
        },
        peanuts: {
          keywords: ["food", "nut"],
          char: "🥜",
        },
        honey_pot: {
          keywords: ["bees", "sweet", "kitchen"],
          char: "🍯",
        },
        croissant: {
          keywords: ["food", "bread", "french"],
          char: "🥐",
        },
        bread: {
          keywords: ["food", "wheat", "breakfast", "toast"],
          char: "🍞",
        },
        baguette_bread: {
          keywords: ["food", "bread", "french"],
          char: "🥖",
        },
        bagel: {
          keywords: ["food", "bread", "bakery", "schmear"],
          char: "🥯",
        },
        pretzel: {
          keywords: ["food", "bread", "twisted"],
          char: "🥨",
        },
        cheese: {
          keywords: ["food", "chadder"],
          char: "🧀",
        },
        egg: {
          keywords: ["food", "chicken", "breakfast"],
          char: "🥚",
        },
        bacon: {
          keywords: ["food", "breakfast", "pork", "pig", "meat"],
          char: "🥓",
        },
        steak: {
          keywords: [
            "food",
            "cow",
            "meat",
            "cut",
            "chop",
            "lambchop",
            "porkchop",
          ],
          char: "🥩",
        },
        pancakes: {
          keywords: ["food", "breakfast", "flapjacks", "hotcakes"],
          char: "🥞",
        },
        poultry_leg: {
          keywords: ["food", "meat", "drumstick", "bird", "chicken", "turkey"],
          char: "🍗",
        },
        meat_on_bone: {
          keywords: ["good", "food", "drumstick"],
          char: "🍖",
        },
        bone: {
          keywords: ["skeleton"],
          char: "🦴",
        },
        fried_shrimp: {
          keywords: ["food", "animal", "appetizer", "summer"],
          char: "🍤",
        },
        fried_egg: {
          keywords: ["food", "breakfast", "kitchen", "egg"],
          char: "🍳",
        },
        hamburger: {
          keywords: [
            "meat",
            "fast food",
            "beef",
            "cheeseburger",
            "mcdonalds",
            "burger king",
          ],
          char: "🍔",
        },
        fries: {
          keywords: ["chips", "snack", "fast food"],
          char: "🍟",
        },
        stuffed_flatbread: {
          keywords: ["food", "flatbread", "stuffed", "gyro"],
          char: "🥙",
        },
        hotdog: {
          keywords: ["food", "frankfurter"],
          char: "🌭",
        },
        pizza: {
          keywords: ["food", "party"],
          char: "🍕",
        },
        sandwich: {
          keywords: ["food", "lunch", "bread"],
          char: "🥪",
        },
        canned_food: {
          keywords: ["food", "soup"],
          char: "🥫",
        },
        spaghetti: {
          keywords: ["food", "italian", "noodle"],
          char: "🍝",
        },
        taco: {
          keywords: ["food", "mexican"],
          char: "🌮",
        },
        burrito: {
          keywords: ["food", "mexican"],
          char: "🌯",
        },
        green_salad: {
          keywords: ["food", "healthy", "lettuce"],
          char: "🥗",
        },
        shallow_pan_of_food: {
          keywords: ["food", "cooking", "casserole", "paella"],
          char: "🥘",
        },
        ramen: {
          keywords: ["food", "japanese", "noodle", "chopsticks"],
          char: "🍜",
        },
        stew: {
          keywords: ["food", "meat", "soup"],
          char: "🍲",
        },
        fish_cake: {
          keywords: [
            "food",
            "japan",
            "sea",
            "beach",
            "narutomaki",
            "pink",
            "swirl",
            "kamaboko",
            "surimi",
            "ramen",
          ],
          char: "🍥",
        },
        fortune_cookie: {
          keywords: ["food", "prophecy"],
          char: "🥠",
        },
        sushi: {
          keywords: ["food", "fish", "japanese", "rice"],
          char: "🍣",
        },
        bento: {
          keywords: ["food", "japanese", "box"],
          char: "🍱",
        },
        curry: {
          keywords: ["food", "spicy", "hot", "indian"],
          char: "🍛",
        },
        rice_ball: {
          keywords: ["food", "japanese"],
          char: "🍙",
        },
        rice: {
          keywords: ["food", "china", "asian"],
          char: "🍚",
        },
        rice_cracker: {
          keywords: ["food", "japanese"],
          char: "🍘",
        },
        oden: {
          keywords: ["food", "japanese"],
          char: "🍢",
        },
        dango: {
          keywords: [
            "food",
            "dessert",
            "sweet",
            "japanese",
            "barbecue",
            "meat",
          ],
          char: "🍡",
        },
        shaved_ice: {
          keywords: ["hot", "dessert", "summer"],
          char: "🍧",
        },
        ice_cream: {
          keywords: ["food", "hot", "dessert"],
          char: "🍨",
        },
        icecream: {
          keywords: ["food", "hot", "dessert", "summer"],
          char: "🍦",
        },
        pie: {
          keywords: ["food", "dessert", "pastry"],
          char: "🥧",
        },
        cake: {
          keywords: ["food", "dessert"],
          char: "🍰",
        },
        cupcake: {
          keywords: ["food", "dessert", "bakery", "sweet"],
          char: "🧁",
        },
        moon_cake: {
          keywords: ["food", "autumn"],
          char: "🥮",
        },
        birthday: {
          keywords: ["food", "dessert", "cake"],
          char: "🎂",
        },
        custard: {
          keywords: ["dessert", "food"],
          char: "🍮",
        },
        candy: {
          keywords: ["snack", "dessert", "sweet", "lolly"],
          char: "🍬",
        },
        lollipop: {
          keywords: ["food", "snack", "candy", "sweet"],
          char: "🍭",
        },
        chocolate_bar: {
          keywords: ["food", "snack", "dessert", "sweet"],
          char: "🍫",
        },
        popcorn: {
          keywords: ["food", "movie theater", "films", "snack"],
          char: "🍿",
        },
        dumpling: {
          keywords: ["food", "empanada", "pierogi", "potsticker"],
          char: "🥟",
        },
        doughnut: {
          keywords: ["food", "dessert", "snack", "sweet", "donut"],
          char: "🍩",
        },
        cookie: {
          keywords: ["food", "snack", "oreo", "chocolate", "sweet", "dessert"],
          char: "🍪",
        },
        milk_glass: {
          keywords: ["beverage", "drink", "cow"],
          char: "🥛",
        },
        beer: {
          keywords: [
            "relax",
            "beverage",
            "drink",
            "drunk",
            "party",
            "pub",
            "summer",
            "alcohol",
            "booze",
          ],
          char: "🍺",
        },
        beers: {
          keywords: [
            "relax",
            "beverage",
            "drink",
            "drunk",
            "party",
            "pub",
            "summer",
            "alcohol",
            "booze",
          ],
          char: "🍻",
        },
        clinking_glasses: {
          keywords: [
            "beverage",
            "drink",
            "party",
            "alcohol",
            "celebrate",
            "cheers",
            "wine",
            "champagne",
            "toast",
          ],
          char: "🥂",
        },
        wine_glass: {
          keywords: ["drink", "beverage", "drunk", "alcohol", "booze"],
          char: "🍷",
        },
        tumbler_glass: {
          keywords: [
            "drink",
            "beverage",
            "drunk",
            "alcohol",
            "liquor",
            "booze",
            "bourbon",
            "scotch",
            "whisky",
            "glass",
            "shot",
          ],
          char: "🥃",
        },
        cocktail: {
          keywords: [
            "drink",
            "drunk",
            "alcohol",
            "beverage",
            "booze",
            "mojito",
          ],
          char: "🍸",
        },
        tropical_drink: {
          keywords: [
            "beverage",
            "cocktail",
            "summer",
            "beach",
            "alcohol",
            "booze",
            "mojito",
          ],
          char: "🍹",
        },
        champagne: {
          keywords: ["drink", "wine", "bottle", "celebration"],
          char: "🍾",
        },
        sake: {
          keywords: [
            "wine",
            "drink",
            "drunk",
            "beverage",
            "japanese",
            "alcohol",
            "booze",
          ],
          char: "🍶",
        },
        tea: {
          keywords: ["drink", "bowl", "breakfast", "green", "british"],
          char: "🍵",
        },
        cup_with_straw: {
          keywords: ["drink", "soda"],
          char: "🥤",
        },
        coffee: {
          keywords: ["beverage", "caffeine", "latte", "espresso"],
          char: "☕",
        },
        baby_bottle: {
          keywords: ["food", "container", "milk"],
          char: "🍼",
        },
        salt: {
          keywords: ["condiment", "shaker"],
          char: "🧂",
        },
        spoon: {
          keywords: ["cutlery", "kitchen", "tableware"],
          char: "🥄",
        },
        fork_and_knife: {
          keywords: ["cutlery", "kitchen"],
          char: "🍴",
        },
        plate_with_cutlery: {
          keywords: ["food", "eat", "meal", "lunch", "dinner", "restaurant"],
          char: "🍽",
        },
        bowl_with_spoon: {
          keywords: ["food", "breakfast", "cereal", "oatmeal", "porridge"],
          char: "🥣",
        },
        takeout_box: {
          keywords: ["food", "leftovers"],
          char: "🥡",
        },
        chopsticks: {
          keywords: ["food"],
          char: "🥢",
        },
      },
    },
  },

  {
    activity: {
      id: "activity",
      name: "Activity",
      symbol: Activity,
      emojis: {
        soccer: {
          keywords: ["sports", "football"],
          char: "⚽",
        },
        basketball: {
          keywords: ["sports", "balls", "NBA"],
          char: "🏀",
        },
        football: {
          keywords: ["sports", "balls", "NFL"],
          char: "🏈",
        },
        baseball: {
          keywords: ["sports", "balls"],
          char: "⚾",
        },
        softball: {
          keywords: ["sports", "balls"],
          char: "🥎",
        },
        tennis: {
          keywords: ["sports", "balls", "green"],
          char: "🎾",
        },
        volleyball: {
          keywords: ["sports", "balls"],
          char: "🏐",
        },
        rugby_football: {
          keywords: ["sports", "team"],
          char: "🏉",
        },
        flying_disc: {
          keywords: ["sports", "frisbee", "ultimate"],
          char: "🥏",
        },
        "8ball": {
          keywords: ["pool", "hobby", "game", "luck", "magic"],
          char: "🎱",
        },
        golf: {
          keywords: ["sports", "business", "flag", "hole", "summer"],
          char: "⛳",
        },
        golfing_woman: {
          keywords: ["sports", "business", "woman", "female"],
          char: "🏌️‍♀️",
        },
        golfing_man: {
          keywords: ["sports", "business"],
          char: "🏌",
          fitzpatrick_scale: true,
        },
        ping_pong: {
          keywords: ["sports", "pingpong"],
          char: "🏓",
        },
        badminton: {
          keywords: ["sports"],
          char: "🏸",
        },
        goal_net: {
          keywords: ["sports"],
          char: "🥅",
        },
        ice_hockey: {
          keywords: ["sports"],
          char: "🏒",
        },
        field_hockey: {
          keywords: ["sports"],
          char: "🏑",
        },
        lacrosse: {
          keywords: ["sports", "ball", "stick"],
          char: "🥍",
        },
        cricket: {
          keywords: ["sports"],
          char: "🏏",
        },
        ski: {
          keywords: ["sports", "winter", "cold", "snow"],
          char: "🎿",
        },
        skier: {
          keywords: ["sports", "winter", "snow"],
          char: "⛷",
        },
        snowboarder: {
          keywords: ["sports", "winter"],
          char: "🏂",
          fitzpatrick_scale: true,
        },
        person_fencing: {
          keywords: ["sports", "fencing", "sword"],
          char: "🤺",
        },
        women_wrestling: {
          keywords: ["sports", "wrestlers"],
          char: "🤼‍♀️",
        },
        men_wrestling: {
          keywords: ["sports", "wrestlers"],
          char: "🤼‍♂️",
        },
        woman_cartwheeling: {
          keywords: ["gymnastics"],
          char: "🤸‍♀️",
          fitzpatrick_scale: true,
        },
        man_cartwheeling: {
          keywords: ["gymnastics"],
          char: "🤸‍♂️",
          fitzpatrick_scale: true,
        },
        woman_playing_handball: {
          keywords: ["sports"],
          char: "🤾‍♀️",
          fitzpatrick_scale: true,
        },
        man_playing_handball: {
          keywords: ["sports"],
          char: "🤾‍♂️",
          fitzpatrick_scale: true,
        },
        ice_skate: {
          keywords: ["sports"],
          char: "⛸",
        },
        curling_stone: {
          keywords: ["sports"],
          char: "🥌",
        },
        skateboard: {
          keywords: ["board"],
          char: "🛹",
        },
        sled: {
          keywords: ["sleigh", "luge", "toboggan"],
          char: "🛷",
        },
        bow_and_arrow: {
          keywords: ["sports"],
          char: "🏹",
        },
        fishing_pole_and_fish: {
          keywords: ["food", "hobby", "summer"],
          char: "🎣",
        },
        boxing_glove: {
          keywords: ["sports", "fighting"],
          char: "🥊",
        },
        martial_arts_uniform: {
          keywords: ["judo", "karate", "taekwondo"],
          char: "🥋",
        },
        rowing_woman: {
          keywords: ["sports", "hobby", "water", "ship", "woman", "female"],
          char: "🚣‍♀️",
          fitzpatrick_scale: true,
        },
        rowing_man: {
          keywords: ["sports", "hobby", "water", "ship"],
          char: "🚣",
          fitzpatrick_scale: true,
        },
        climbing_woman: {
          keywords: ["sports", "hobby", "woman", "female", "rock"],
          char: "🧗‍♀️",
          fitzpatrick_scale: true,
        },
        climbing_man: {
          keywords: ["sports", "hobby", "man", "male", "rock"],
          char: "🧗‍♂️",
          fitzpatrick_scale: true,
        },
        swimming_woman: {
          keywords: [
            "sports",
            "exercise",
            "human",
            "athlete",
            "water",
            "summer",
            "woman",
            "female",
          ],
          char: "🏊‍♀️",
          fitzpatrick_scale: true,
        },
        swimming_man: {
          keywords: [
            "sports",
            "exercise",
            "human",
            "athlete",
            "water",
            "summer",
          ],
          char: "🏊",
          fitzpatrick_scale: true,
        },
        woman_playing_water_polo: {
          keywords: ["sports", "pool"],
          char: "🤽‍♀️",
          fitzpatrick_scale: true,
        },
        man_playing_water_polo: {
          keywords: ["sports", "pool"],
          char: "🤽‍♂️",
          fitzpatrick_scale: true,
        },
        woman_in_lotus_position: {
          keywords: [
            "woman",
            "female",
            "meditation",
            "yoga",
            "serenity",
            "zen",
            "mindfulness",
          ],
          char: "🧘‍♀️",
          fitzpatrick_scale: true,
        },
        man_in_lotus_position: {
          keywords: [
            "man",
            "male",
            "meditation",
            "yoga",
            "serenity",
            "zen",
            "mindfulness",
          ],
          char: "🧘‍♂️",
          fitzpatrick_scale: true,
        },
        surfing_woman: {
          keywords: [
            "sports",
            "ocean",
            "sea",
            "summer",
            "beach",
            "woman",
            "female",
          ],
          char: "🏄‍♀️",
          fitzpatrick_scale: true,
        },
        surfing_man: {
          keywords: ["sports", "ocean", "sea", "summer", "beach"],
          char: "🏄",
          fitzpatrick_scale: true,
        },
        bath: {
          keywords: ["clean", "shower", "bathroom"],
          char: "🛀",
          fitzpatrick_scale: true,
        },
        basketball_woman: {
          keywords: ["sports", "human", "woman", "female"],
          char: "⛹️‍♀️",
          fitzpatrick_scale: true,
        },
        basketball_man: {
          keywords: ["sports", "human"],
          char: "⛹",
          fitzpatrick_scale: true,
        },
        weight_lifting_woman: {
          keywords: ["sports", "training", "exercise", "woman", "female"],
          char: "🏋️‍♀️",
          fitzpatrick_scale: true,
        },
        weight_lifting_man: {
          keywords: ["sports", "training", "exercise"],
          char: "🏋",
          fitzpatrick_scale: true,
        },
        biking_woman: {
          keywords: [
            "sports",
            "bike",
            "exercise",
            "hipster",
            "woman",
            "female",
          ],
          char: "🚴‍♀️",
          fitzpatrick_scale: true,
        },
        biking_man: {
          keywords: ["sports", "bike", "exercise", "hipster"],
          char: "🚴",
          fitzpatrick_scale: true,
        },
        mountain_biking_woman: {
          keywords: [
            "transportation",
            "sports",
            "human",
            "race",
            "bike",
            "woman",
            "female",
          ],
          char: "🚵‍♀️",
          fitzpatrick_scale: true,
        },
        mountain_biking_man: {
          keywords: ["transportation", "sports", "human", "race", "bike"],
          char: "🚵",
          fitzpatrick_scale: true,
        },
        horse_racing: {
          keywords: ["animal", "betting", "competition", "gambling", "luck"],
          char: "🏇",
          fitzpatrick_scale: true,
        },
        business_suit_levitating: {
          keywords: ["suit", "business", "levitate", "hover", "jump"],
          char: "🕴",
          fitzpatrick_scale: true,
        },
        trophy: {
          keywords: ["win", "award", "contest", "place", "ftw", "ceremony"],
          char: "🏆",
        },
        running_shirt_with_sash: {
          keywords: ["play", "pageant"],
          char: "🎽",
        },
        medal_sports: {
          keywords: ["award", "winning"],
          char: "🏅",
        },
        medal_military: {
          keywords: ["award", "winning", "army"],
          char: "🎖",
        },
        "1st_place_medal": {
          keywords: ["award", "winning", "first"],
          char: "🥇",
        },
        "2nd_place_medal": {
          keywords: ["award", "second"],
          char: "🥈",
        },
        "3rd_place_medal": {
          keywords: ["award", "third"],
          char: "🥉",
        },
        reminder_ribbon: {
          keywords: ["sports", "cause", "support", "awareness"],
          char: "🎗",
        },
        rosette: {
          keywords: ["flower", "decoration", "military"],
          char: "🏵",
        },
        ticket: {
          keywords: ["event", "concert", "pass"],
          char: "🎫",
        },
        tickets: {
          keywords: ["sports", "concert", "entrance"],
          char: "🎟",
        },
        performing_arts: {
          keywords: ["acting", "theater", "drama"],
          char: "🎭",
        },
        art: {
          keywords: ["design", "paint", "draw", "colors"],
          char: "🎨",
        },
        circus_tent: {
          keywords: ["festival", "carnival", "party"],
          char: "🎪",
        },
        woman_juggling: {
          keywords: ["juggle", "balance", "skill", "multitask"],
          char: "🤹‍♀️",
          fitzpatrick_scale: true,
        },
        man_juggling: {
          keywords: ["juggle", "balance", "skill", "multitask"],
          char: "🤹‍♂️",
          fitzpatrick_scale: true,
        },
        microphone: {
          keywords: ["sound", "music", "PA", "sing", "talkshow"],
          char: "🎤",
        },
        headphones: {
          keywords: ["music", "score", "gadgets"],
          char: "🎧",
        },
        musical_score: {
          keywords: ["treble", "clef", "compose"],
          char: "🎼",
        },
        musical_keyboard: {
          keywords: ["piano", "instrument", "compose"],
          char: "🎹",
        },
        drum: {
          keywords: ["music", "instrument", "drumsticks", "snare"],
          char: "🥁",
        },
        saxophone: {
          keywords: ["music", "instrument", "jazz", "blues"],
          char: "🎷",
        },
        trumpet: {
          keywords: ["music", "brass"],
          char: "🎺",
        },
        guitar: {
          keywords: ["music", "instrument"],
          char: "🎸",
        },
        violin: {
          keywords: ["music", "instrument", "orchestra", "symphony"],
          char: "🎻",
        },
        clapper: {
          keywords: ["movie", "film", "record"],
          char: "🎬",
        },
        video_game: {
          keywords: ["play", "console", "PS4", "controller"],
          char: "🎮",
        },
        space_invader: {
          keywords: ["game", "arcade", "play"],
          char: "👾",
        },
        dart: {
          keywords: ["game", "play", "bar", "target", "bullseye"],
          char: "🎯",
        },
        game_die: {
          keywords: ["dice", "random", "tabletop", "play", "luck"],
          char: "🎲",
        },
        chess_pawn: {
          keywords: ["expendable"],
          char: "♟",
        },
        slot_machine: {
          keywords: [
            "bet",
            "gamble",
            "vegas",
            "fruit machine",
            "luck",
            "casino",
          ],
          char: "🎰",
        },
        jigsaw: {
          keywords: ["interlocking", "puzzle", "piece"],
          char: "🧩",
        },
        bowling: {
          keywords: ["sports", "fun", "play"],
          char: "🎳",
        },
      },
    },
  },

  {
    travel: {
      id: "travel_and_places",
      name: "Travel & Places",
      symbol: Travel,
      emojis: {
        red_car: {
          keywords: ["red", "transportation", "vehicle"],
          char: "🚗",
        },
        taxi: {
          keywords: ["uber", "vehicle", "cars", "transportation"],
          char: "🚕",
        },
        blue_car: {
          keywords: ["transportation", "vehicle"],
          char: "🚙",
        },
        bus: {
          keywords: ["car", "vehicle", "transportation"],
          char: "🚌",
        },
        trolleybus: {
          keywords: ["bart", "transportation", "vehicle"],
          char: "🚎",
        },
        racing_car: {
          keywords: ["sports", "race", "fast", "formula", "f1"],
          char: "🏎",
        },
        police_car: {
          keywords: [
            "vehicle",
            "cars",
            "transportation",
            "law",
            "legal",
            "enforcement",
          ],
          char: "🚓",
        },
        ambulance: {
          keywords: ["health", "911", "hospital"],
          char: "🚑",
        },
        fire_engine: {
          keywords: ["transportation", "cars", "vehicle"],
          char: "🚒",
        },
        minibus: {
          keywords: ["vehicle", "car", "transportation"],
          char: "🚐",
        },
        truck: {
          keywords: ["cars", "transportation"],
          char: "🚚",
        },
        articulated_lorry: {
          keywords: ["vehicle", "cars", "transportation", "express"],
          char: "🚛",
        },
        tractor: {
          keywords: ["vehicle", "car", "farming", "agriculture"],
          char: "🚜",
        },
        kick_scooter: {
          keywords: ["vehicle", "kick", "razor"],
          char: "🛴",
        },
        motorcycle: {
          keywords: ["race", "sports", "fast"],
          char: "🏍",
        },
        bike: {
          keywords: ["sports", "bicycle", "exercise", "hipster"],
          char: "🚲",
        },
        motor_scooter: {
          keywords: ["vehicle", "vespa", "sasha"],
          char: "🛵",
        },
        rotating_light: {
          keywords: [
            "police",
            "ambulance",
            "911",
            "emergency",
            "alert",
            "error",
            "pinged",
            "law",
            "legal",
          ],
          char: "🚨",
        },
        oncoming_police_car: {
          keywords: ["vehicle", "law", "legal", "enforcement", "911"],
          char: "🚔",
        },
        oncoming_bus: {
          keywords: ["vehicle", "transportation"],
          char: "🚍",
        },
        oncoming_automobile: {
          keywords: ["car", "vehicle", "transportation"],
          char: "🚘",
        },
        oncoming_taxi: {
          keywords: ["vehicle", "cars", "uber"],
          char: "🚖",
        },
        aerial_tramway: {
          keywords: ["transportation", "vehicle", "ski"],
          char: "🚡",
        },
        mountain_cableway: {
          keywords: ["transportation", "vehicle", "ski"],
          char: "🚠",
        },
        suspension_railway: {
          keywords: ["vehicle", "transportation"],
          char: "🚟",
        },
        railway_car: {
          keywords: ["transportation", "vehicle"],
          char: "🚃",
        },
        train: {
          keywords: [
            "transportation",
            "vehicle",
            "carriage",
            "public",
            "travel",
          ],
          char: "🚋",
        },
        monorail: {
          keywords: ["transportation", "vehicle"],
          char: "🚝",
        },
        bullettrain_side: {
          keywords: ["transportation", "vehicle"],
          char: "🚄",
        },
        bullettrain_front: {
          keywords: [
            "transportation",
            "vehicle",
            "speed",
            "fast",
            "public",
            "travel",
          ],
          char: "🚅",
        },
        light_rail: {
          keywords: ["transportation", "vehicle"],
          char: "🚈",
        },
        mountain_railway: {
          keywords: ["transportation", "vehicle"],
          char: "🚞",
        },
        steam_locomotive: {
          keywords: ["transportation", "vehicle", "train"],
          char: "🚂",
        },
        train2: {
          keywords: ["transportation", "vehicle"],
          char: "🚆",
        },
        metro: {
          keywords: [
            "transportation",
            "blue-square",
            "mrt",
            "underground",
            "tube",
          ],
          char: "🚇",
        },
        tram: {
          keywords: ["transportation", "vehicle"],
          char: "🚊",
        },
        station: {
          keywords: ["transportation", "vehicle", "public"],
          char: "🚉",
        },
        flying_saucer: {
          keywords: ["transportation", "vehicle", "ufo"],
          char: "🛸",
        },
        helicopter: {
          keywords: ["transportation", "vehicle", "fly"],
          char: "🚁",
        },
        small_airplane: {
          keywords: ["flight", "transportation", "fly", "vehicle"],
          char: "🛩",
        },
        airplane: {
          keywords: ["vehicle", "transportation", "flight", "fly"],
          char: "✈️",
        },
        flight_departure: {
          keywords: ["airport", "flight", "landing"],
          char: "🛫",
        },
        flight_arrival: {
          keywords: ["airport", "flight", "boarding"],
          char: "🛬",
        },
        sailboat: {
          keywords: ["ship", "summer", "transportation", "water", "sailing"],
          char: "⛵",
        },
        motor_boat: {
          keywords: ["ship"],
          char: "🛥",
        },
        speedboat: {
          keywords: ["ship", "transportation", "vehicle", "summer"],
          char: "🚤",
        },
        ferry: {
          keywords: ["boat", "ship", "yacht"],
          char: "⛴",
        },
        passenger_ship: {
          keywords: ["yacht", "cruise", "ferry"],
          char: "🛳",
        },
        rocket: {
          keywords: [
            "launch",
            "ship",
            "staffmode",
            "NASA",
            "outer space",
            "outer_space",
            "fly",
          ],
          char: "🚀",
        },
        artificial_satellite: {
          keywords: [
            "communication",
            "gps",
            "orbit",
            "spaceflight",
            "NASA",
            "ISS",
          ],
          char: "🛰",
        },
        seat: {
          keywords: ["sit", "airplane", "transport", "bus", "flight", "fly"],
          char: "💺",
        },
        canoe: {
          keywords: ["boat", "paddle", "water", "ship"],
          char: "🛶",
        },
        anchor: {
          keywords: ["ship", "ferry", "sea", "boat"],
          char: "⚓",
        },
        construction: {
          keywords: ["wip", "progress", "caution", "warning"],
          char: "🚧",
        },
        fuelpump: {
          keywords: ["gas station", "petroleum"],
          char: "⛽",
        },
        busstop: {
          keywords: ["transportation", "wait"],
          char: "🚏",
        },
        vertical_traffic_light: {
          keywords: ["transportation", "driving"],
          char: "🚦",
        },
        traffic_light: {
          keywords: ["transportation", "signal"],
          char: "🚥",
        },
        checkered_flag: {
          keywords: ["contest", "finishline", "race", "gokart"],
          char: "🏁",
        },
        ship: {
          keywords: ["transportation", "titanic", "deploy"],
          char: "🚢",
        },
        ferris_wheel: {
          keywords: ["photo", "carnival", "londoneye"],
          char: "🎡",
        },
        roller_coaster: {
          keywords: ["carnival", "playground", "photo", "fun"],
          char: "🎢",
        },
        carousel_horse: {
          keywords: ["photo", "carnival"],
          char: "🎠",
        },
        building_construction: {
          keywords: ["wip", "working", "progress"],
          char: "🏗",
        },
        foggy: {
          keywords: ["photo", "mountain"],
          char: "🌁",
        },
        tokyo_tower: {
          keywords: ["photo", "japanese"],
          char: "🗼",
        },
        factory: {
          keywords: ["building", "industry", "pollution", "smoke"],
          char: "🏭",
        },
        fountain: {
          keywords: ["photo", "summer", "water", "fresh"],
          char: "⛲",
        },
        rice_scene: {
          keywords: ["photo", "japan", "asia", "tsukimi"],
          char: "🎑",
        },
        mountain: {
          keywords: ["photo", "nature", "environment"],
          char: "⛰",
        },
        mountain_snow: {
          keywords: ["photo", "nature", "environment", "winter", "cold"],
          char: "🏔",
        },
        mount_fuji: {
          keywords: ["photo", "mountain", "nature", "japanese"],
          char: "🗻",
        },
        volcano: {
          keywords: ["photo", "nature", "disaster"],
          char: "🌋",
        },
        japan: {
          keywords: ["nation", "country", "japanese", "asia"],
          char: "🗾",
        },
        camping: {
          keywords: ["photo", "outdoors", "tent"],
          char: "🏕",
        },
        tent: {
          keywords: ["photo", "camping", "outdoors"],
          char: "⛺",
        },
        national_park: {
          keywords: ["photo", "environment", "nature"],
          char: "🏞",
        },
        motorway: {
          keywords: ["road", "cupertino", "interstate", "highway"],
          char: "🛣",
        },
        railway_track: {
          keywords: ["train", "transportation"],
          char: "🛤",
        },
        sunrise: {
          keywords: ["morning", "view", "vacation", "photo"],
          char: "🌅",
        },
        sunrise_over_mountains: {
          keywords: ["view", "vacation", "photo"],
          char: "🌄",
        },
        desert: {
          keywords: ["photo", "warm", "saharah"],
          char: "🏜",
        },
        beach_umbrella: {
          keywords: ["weather", "summer", "sunny", "sand", "mojito"],
          char: "🏖",
        },
        desert_island: {
          keywords: ["photo", "tropical", "mojito"],
          char: "🏝",
        },
        city_sunrise: {
          keywords: ["photo", "good morning", "dawn"],
          char: "🌇",
        },
        city_sunset: {
          keywords: ["photo", "evening", "sky", "buildings"],
          char: "🌆",
        },
        cityscape: {
          keywords: ["photo", "night life", "urban"],
          char: "🏙",
        },
        night_with_stars: {
          keywords: ["evening", "city", "downtown"],
          char: "🌃",
        },
        bridge_at_night: {
          keywords: ["photo", "sanfrancisco"],
          char: "🌉",
        },
        milky_way: {
          keywords: ["photo", "space", "stars"],
          char: "🌌",
        },
        stars: {
          keywords: ["night", "photo"],
          char: "🌠",
        },
        sparkler: {
          keywords: ["stars", "night", "shine"],
          char: "🎇",
        },
        fireworks: {
          keywords: ["photo", "festival", "carnival", "congratulations"],
          char: "🎆",
        },
        rainbow: {
          keywords: [
            "nature",
            "happy",
            "unicorn_face",
            "photo",
            "sky",
            "spring",
          ],
          char: "🌈",
        },
        houses: {
          keywords: ["buildings", "photo"],
          char: "🏘",
        },
        european_castle: {
          keywords: ["building", "royalty", "history"],
          char: "🏰",
        },
        japanese_castle: {
          keywords: ["photo", "building"],
          char: "🏯",
        },
        stadium: {
          keywords: ["photo", "place", "sports", "concert", "venue"],
          char: "🏟",
        },
        statue_of_liberty: {
          keywords: ["american", "newyork"],
          char: "🗽",
        },
        house: {
          keywords: ["building", "home"],
          char: "🏠",
        },
        house_with_garden: {
          keywords: ["home", "plant", "nature"],
          char: "🏡",
        },
        derelict_house: {
          keywords: ["abandon", "evict", "broken", "building"],
          char: "🏚",
        },
        office: {
          keywords: ["building", "bureau", "work"],
          char: "🏢",
        },
        department_store: {
          keywords: ["building", "shopping", "mall"],
          char: "🏬",
        },
        post_office: {
          keywords: ["building", "envelope", "communication"],
          char: "🏣",
        },
        european_post_office: {
          keywords: ["building", "email"],
          char: "🏤",
        },
        hospital: {
          keywords: ["building", "health", "surgery", "doctor"],
          char: "🏥",
        },
        bank: {
          keywords: [
            "building",
            "money",
            "sales",
            "cash",
            "business",
            "enterprise",
          ],
          char: "🏦",
        },
        hotel: {
          keywords: ["building", "accomodation", "checkin"],
          char: "🏨",
        },
        convenience_store: {
          keywords: ["building", "shopping", "groceries"],
          char: "🏪",
        },
        school: {
          keywords: ["building", "student", "education", "learn", "teach"],
          char: "🏫",
        },
        love_hotel: {
          keywords: ["like", "affection", "dating"],
          char: "🏩",
        },
        wedding: {
          keywords: [
            "love",
            "like",
            "affection",
            "couple",
            "marriage",
            "bride",
            "groom",
          ],
          char: "💒",
        },
        classical_building: {
          keywords: ["art", "culture", "history"],
          char: "🏛",
        },
        church: {
          keywords: ["building", "religion", "christ"],
          char: "⛪",
        },
        mosque: {
          keywords: ["islam", "worship", "minaret"],
          char: "🕌",
        },
        synagogue: {
          keywords: ["judaism", "worship", "temple", "jewish"],
          char: "🕍",
        },
        kaaba: {
          keywords: ["mecca", "mosque", "islam"],
          char: "🕋",
        },
        shinto_shrine: {
          keywords: ["temple", "japan", "kyoto"],
          char: "⛩",
        },
      },
    },
  },

  {
    objects: {
      id: "objects",
      name: "Objects",
      symbol: Objects,
      emojis: {
        watch: {
          keywords: ["time", "accessories"],
          char: "⌚",
        },
        iphone: {
          keywords: ["technology", "apple", "gadgets", "dial"],
          char: "📱",
        },
        calling: {
          keywords: ["iphone", "incoming"],
          char: "📲",
        },
        computer: {
          keywords: ["technology", "laptop", "screen", "display", "monitor"],
          char: "💻",
        },
        keyboard: {
          keywords: ["technology", "computer", "type", "input", "text"],
          char: "⌨",
        },
        desktop_computer: {
          keywords: ["technology", "computing", "screen"],
          char: "🖥",
        },
        printer: {
          keywords: ["paper", "ink"],
          char: "🖨",
        },
        computer_mouse: {
          keywords: ["click"],
          char: "🖱",
        },
        trackball: {
          keywords: ["technology", "trackpad"],
          char: "🖲",
        },
        joystick: {
          keywords: ["game", "play"],
          char: "🕹",
        },
        clamp: {
          keywords: ["tool"],
          char: "🗜",
        },
        minidisc: {
          keywords: ["technology", "record", "emojies", "disk", "90s"],
          char: "💽",
        },
        floppy_disk: {
          keywords: ["oldschool", "technology", "save", "90s", "80s"],
          char: "💾",
        },
        cd: {
          keywords: ["technology", "dvd", "disk", "disc", "90s"],
          char: "💿",
        },
        dvd: {
          keywords: ["cd", "disk", "disc"],
          char: "📀",
        },
        vhs: {
          keywords: ["record", "video", "oldschool", "90s", "80s"],
          char: "📼",
        },
        camera: {
          keywords: ["gadgets", "photography"],
          char: "📷",
        },
        camera_flash: {
          keywords: ["photography", "gadgets"],
          char: "📸",
        },
        video_camera: {
          keywords: ["film", "record"],
          char: "📹",
        },
        movie_camera: {
          keywords: ["film", "record"],
          char: "🎥",
        },
        film_projector: {
          keywords: ["video", "tape", "record", "movie"],
          char: "📽",
        },
        film_strip: {
          keywords: ["movie"],
          char: "🎞",
        },
        telephone_receiver: {
          keywords: ["technology", "communication", "dial"],
          char: "📞",
        },
        phone: {
          keywords: ["technology", "communication", "dial", "telephone"],
          char: "☎️",
        },
        pager: {
          keywords: ["bbcall", "oldschool", "90s"],
          char: "📟",
        },
        fax: {
          keywords: ["communication", "technology"],
          char: "📠",
        },
        tv: {
          keywords: [
            "technology",
            "program",
            "oldschool",
            "show",
            "television",
          ],
          char: "📺",
        },
        radio: {
          keywords: ["communication", "music", "podcast", "program"],
          char: "📻",
        },
        studio_microphone: {
          keywords: ["sing", "recording", "artist", "talkshow"],
          char: "🎙",
        },
        level_slider: {
          keywords: ["scale"],
          char: "🎚",
        },
        control_knobs: {
          keywords: ["dial"],
          char: "🎛",
        },
        compass: {
          keywords: ["magnetic", "navigation", "orienteering"],
          char: "🧭",
        },
        stopwatch: {
          keywords: ["time", "deadline"],
          char: "⏱",
        },
        timer_clock: {
          keywords: ["alarm"],
          char: "⏲",
        },
        alarm_clock: {
          keywords: ["time", "wake"],
          char: "⏰",
        },
        mantelpiece_clock: {
          keywords: ["time"],
          char: "🕰",
        },
        hourglass_flowing_sand: {
          keywords: ["oldschool", "time", "countdown"],
          char: "⏳",
        },
        hourglass: {
          keywords: [
            "time",
            "clock",
            "oldschool",
            "limit",
            "exam",
            "quiz",
            "test",
          ],
          char: "⌛",
        },
        satellite: {
          keywords: ["communication", "future", "radio", "space"],
          char: "📡",
        },
        battery: {
          keywords: ["power", "energy", "sustain"],
          char: "🔋",
        },
        electric_plug: {
          keywords: ["charger", "power"],
          char: "🔌",
        },
        bulb: {
          keywords: ["light", "electricity", "idea"],
          char: "💡",
        },
        flashlight: {
          keywords: ["dark", "camping", "sight", "night"],
          char: "🔦",
        },
        candle: {
          keywords: ["fire", "wax"],
          char: "🕯",
        },
        fire_extinguisher: {
          keywords: ["quench"],
          char: "🧯",
        },
        wastebasket: {
          keywords: ["bin", "trash", "rubbish", "garbage", "toss"],
          char: "🗑",
        },
        oil_drum: {
          keywords: ["barrell"],
          char: "🛢",
        },
        money_with_wings: {
          keywords: ["dollar", "bills", "payment", "sale"],
          char: "💸",
        },
        dollar: {
          keywords: ["money", "sales", "bill", "currency"],
          char: "💵",
        },
        yen: {
          keywords: ["money", "sales", "japanese", "dollar", "currency"],
          char: "💴",
        },
        euro: {
          keywords: ["money", "sales", "dollar", "currency"],
          char: "💶",
        },
        pound: {
          keywords: [
            "british",
            "sterling",
            "money",
            "sales",
            "bills",
            "uk",
            "england",
            "currency",
          ],
          char: "💷",
        },
        moneybag: {
          keywords: ["dollar", "payment", "coins", "sale"],
          char: "💰",
        },
        credit_card: {
          keywords: ["money", "sales", "dollar", "bill", "payment", "shopping"],
          char: "💳",
        },
        gem: {
          keywords: ["blue", "ruby", "diamond", "jewelry"],
          char: "💎",
        },
        balance_scale: {
          keywords: ["law", "fairness", "weight"],
          char: "⚖",
        },
        toolbox: {
          keywords: ["tools", "diy", "fix", "maintainer", "mechanic"],
          char: "🧰",
        },
        wrench: {
          keywords: ["tools", "diy", "ikea", "fix", "maintainer"],
          char: "🔧",
        },
        hammer: {
          keywords: ["tools", "build", "create"],
          char: "🔨",
        },
        hammer_and_pick: {
          keywords: ["tools", "build", "create"],
          char: "⚒",
        },
        hammer_and_wrench: {
          keywords: ["tools", "build", "create"],
          char: "🛠",
        },
        pick: {
          keywords: ["tools", "dig"],
          char: "⛏",
        },
        nut_and_bolt: {
          keywords: ["handy", "tools", "fix"],
          char: "🔩",
        },
        gear: {
          keywords: ["cog"],
          char: "⚙",
        },
        brick: {
          keywords: ["bricks"],
          char: "🧱",
        },
        chains: {
          keywords: ["lock", "arrest"],
          char: "⛓",
        },
        magnet: {
          keywords: ["attraction", "magnetic"],
          char: "🧲",
        },
        gun: {
          keywords: ["violence", "weapon", "pistol", "revolver"],
          char: "🔫",
        },
        bomb: {
          keywords: ["boom", "explode", "explosion", "terrorism"],
          char: "💣",
        },
        firecracker: {
          keywords: ["dynamite", "boom", "explode", "explosion", "explosive"],
          char: "🧨",
        },
        hocho: {
          keywords: ["knife", "blade", "cutlery", "kitchen", "weapon"],
          char: "🔪",
        },
        dagger: {
          keywords: ["weapon"],
          char: "🗡",
        },
        crossed_swords: {
          keywords: ["weapon"],
          char: "⚔",
        },
        shield: {
          keywords: ["protection", "security"],
          char: "🛡",
        },
        smoking: {
          keywords: ["kills", "tobacco", "cigarette", "joint", "smoke"],
          char: "🚬",
        },
        skull_and_crossbones: {
          keywords: [
            "poison",
            "danger",
            "deadly",
            "scary",
            "death",
            "pirate",
            "evil",
          ],
          char: "☠",
        },
        coffin: {
          keywords: [
            "vampire",
            "dead",
            "die",
            "death",
            "rip",
            "graveyard",
            "cemetery",
            "casket",
            "funeral",
            "box",
          ],
          char: "⚰",
        },
        funeral_urn: {
          keywords: ["dead", "die", "death", "rip", "ashes"],
          char: "⚱",
        },
        amphora: {
          keywords: ["vase", "jar"],
          char: "🏺",
        },
        crystal_ball: {
          keywords: ["disco", "party", "magic", "circus", "fortune_teller"],
          char: "🔮",
        },
        prayer_beads: {
          keywords: ["dhikr", "religious"],
          char: "📿",
        },
        nazar_amulet: {
          keywords: ["bead", "charm"],
          char: "🧿",
        },
        barber: {
          keywords: ["hair", "salon", "style"],
          char: "💈",
        },
        alembic: {
          keywords: ["distilling", "science", "experiment", "chemistry"],
          char: "⚗",
        },
        telescope: {
          keywords: ["stars", "space", "zoom", "science", "astronomy"],
          char: "🔭",
        },
        microscope: {
          keywords: ["laboratory", "experiment", "zoomin", "science", "study"],
          char: "🔬",
        },
        hole: {
          keywords: ["embarrassing"],
          char: "🕳",
        },
        pill: {
          keywords: ["health", "medicine", "doctor", "pharmacy", "drug"],
          char: "💊",
        },
        syringe: {
          keywords: [
            "health",
            "hospital",
            "drugs",
            "blood",
            "medicine",
            "needle",
            "doctor",
            "nurse",
          ],
          char: "💉",
        },
        dna: {
          keywords: ["biologist", "genetics", "life"],
          char: "🧬",
        },
        microbe: {
          keywords: ["amoeba", "bacteria", "germs"],
          char: "🦠",
        },
        petri_dish: {
          keywords: ["bacteria", "biology", "culture", "lab"],
          char: "🧫",
        },
        test_tube: {
          keywords: ["chemistry", "experiment", "lab", "science"],
          char: "🧪",
        },
        thermometer: {
          keywords: ["weather", "temperature", "hot", "cold"],
          char: "🌡",
        },
        broom: {
          keywords: ["cleaning", "sweeping", "witch"],
          char: "🧹",
        },
        basket: {
          keywords: ["laundry"],
          char: "🧺",
        },
        toilet_paper: {
          keywords: ["roll"],
          char: "🧻",
        },
        label: {
          keywords: ["sale", "tag"],
          char: "🏷",
        },
        bookmark: {
          keywords: ["favorite", "label", "save"],
          char: "🔖",
        },
        toilet: {
          keywords: ["restroom", "wc", "washroom", "bathroom", "potty"],
          char: "🚽",
        },
        shower: {
          keywords: ["clean", "water", "bathroom"],
          char: "🚿",
        },
        bathtub: {
          keywords: ["clean", "shower", "bathroom"],
          char: "🛁",
        },
        soap: {
          keywords: ["bar", "bathing", "cleaning", "lather"],
          char: "🧼",
        },
        sponge: {
          keywords: ["absorbing", "cleaning", "porous"],
          char: "🧽",
        },
        lotion_bottle: {
          keywords: ["moisturizer", "sunscreen"],
          char: "🧴",
        },
        key: {
          keywords: ["lock", "door", "password"],
          char: "🔑",
        },
        old_key: {
          keywords: ["lock", "door", "password"],
          char: "🗝",
        },
        couch_and_lamp: {
          keywords: ["read", "chill"],
          char: "🛋",
        },
        sleeping_bed: {
          keywords: ["bed", "rest"],
          char: "🛌",
          fitzpatrick_scale: true,
        },
        bed: {
          keywords: ["sleep", "rest"],
          char: "🛏",
        },
        door: {
          keywords: ["house", "entry", "exit"],
          char: "🚪",
        },
        bellhop_bell: {
          keywords: ["service"],
          char: "🛎",
        },
        teddy_bear: {
          keywords: ["plush", "stuffed"],
          char: "🧸",
        },
        framed_picture: {
          keywords: ["photography"],
          char: "🖼",
        },
        world_map: {
          keywords: ["location", "direction"],
          char: "🗺",
        },
        parasol_on_ground: {
          keywords: ["weather", "summer"],
          char: "⛱",
        },
        moyai: {
          keywords: ["rock", "easter island", "moai"],
          char: "🗿",
        },
        shopping: {
          keywords: ["mall", "buy", "purchase"],
          char: "🛍",
        },
        shopping_cart: {
          keywords: ["trolley"],
          char: "🛒",
        },
        balloon: {
          keywords: ["party", "celebration", "birthday", "circus"],
          char: "🎈",
        },
        flags: {
          keywords: ["fish", "japanese", "koinobori", "carp", "banner"],
          char: "🎏",
        },
        ribbon: {
          keywords: ["decoration", "pink", "girl", "bowtie"],
          char: "🎀",
        },
        gift: {
          keywords: ["present", "birthday", "christmas", "xmas"],
          char: "🎁",
        },
        confetti_ball: {
          keywords: ["festival", "party", "birthday", "circus"],
          char: "🎊",
        },
        tada: {
          keywords: [
            "party",
            "congratulations",
            "birthday",
            "magic",
            "circus",
            "celebration",
          ],
          char: "🎉",
        },
        dolls: {
          keywords: ["japanese", "toy", "kimono"],
          char: "🎎",
        },
        wind_chime: {
          keywords: ["nature", "ding", "spring", "bell"],
          char: "🎐",
        },
        crossed_flags: {
          keywords: ["japanese", "nation", "country", "border"],
          char: "🎌",
        },
        izakaya_lantern: {
          keywords: ["light", "paper", "halloween", "spooky"],
          char: "🏮",
        },
        red_envelope: {
          keywords: ["gift"],
          char: "🧧",
        },
        email: {
          keywords: ["letter", "postal", "inbox", "communication"],
          char: "✉️",
        },
        envelope_with_arrow: {
          keywords: ["email", "communication"],
          char: "📩",
        },
        incoming_envelope: {
          keywords: ["email", "inbox"],
          char: "📨",
        },
        "e-mail": {
          keywords: ["communication", "inbox"],
          char: "📧",
        },
        love_letter: {
          keywords: ["email", "like", "affection", "envelope", "valentines"],
          char: "💌",
        },
        postbox: {
          keywords: ["email", "letter", "envelope"],
          char: "📮",
        },
        mailbox_closed: {
          keywords: ["email", "communication", "inbox"],
          char: "📪",
        },
        mailbox: {
          keywords: ["email", "inbox", "communication"],
          char: "📫",
        },
        mailbox_with_mail: {
          keywords: ["email", "inbox", "communication"],
          char: "📬",
        },
        mailbox_with_no_mail: {
          keywords: ["email", "inbox"],
          char: "📭",
        },
        package: {
          keywords: ["mail", "gift", "cardboard", "box", "moving"],
          char: "📦",
        },
        postal_horn: {
          keywords: ["instrument", "music"],
          char: "📯",
        },
        inbox_tray: {
          keywords: ["email", "documents"],
          char: "📥",
        },
        outbox_tray: {
          keywords: ["inbox", "email"],
          char: "📤",
        },
        scroll: {
          keywords: ["documents", "ancient", "history", "paper"],
          char: "📜",
        },
        page_with_curl: {
          keywords: ["documents", "office", "paper"],
          char: "📃",
        },
        bookmark_tabs: {
          keywords: ["favorite", "save", "order", "tidy"],
          char: "📑",
        },
        receipt: {
          keywords: ["accounting", "expenses"],
          char: "🧾",
        },
        bar_chart: {
          keywords: ["graph", "presentation", "stats"],
          char: "📊",
        },
        chart_with_upwards_trend: {
          keywords: [
            "graph",
            "presentation",
            "stats",
            "recovery",
            "business",
            "economics",
            "money",
            "sales",
            "good",
            "success",
          ],
          char: "📈",
        },
        chart_with_downwards_trend: {
          keywords: [
            "graph",
            "presentation",
            "stats",
            "recession",
            "business",
            "economics",
            "money",
            "sales",
            "bad",
            "failure",
          ],
          char: "📉",
        },
        page_facing_up: {
          keywords: ["documents", "office", "paper", "information"],
          char: "📄",
        },
        date: {
          keywords: ["calendar", "schedule"],
          char: "📅",
        },
        calendar: {
          keywords: ["schedule", "date", "planning"],
          char: "📆",
        },
        spiral_calendar: {
          keywords: ["date", "schedule", "planning"],
          char: "🗓",
        },
        card_index: {
          keywords: ["business", "stationery"],
          char: "📇",
        },
        card_file_box: {
          keywords: ["business", "stationery"],
          char: "🗃",
        },
        ballot_box: {
          keywords: ["election", "vote"],
          char: "🗳",
        },
        file_cabinet: {
          keywords: ["filing", "organizing"],
          char: "🗄",
        },
        clipboard: {
          keywords: ["stationery", "documents"],
          char: "📋",
        },
        spiral_notepad: {
          keywords: ["memo", "stationery"],
          char: "🗒",
        },
        file_folder: {
          keywords: ["documents", "business", "office"],
          char: "📁",
        },
        open_file_folder: {
          keywords: ["documents", "load"],
          char: "📂",
        },
        card_index_dividers: {
          keywords: ["organizing", "business", "stationery"],
          char: "🗂",
        },
        newspaper_roll: {
          keywords: ["press", "headline"],
          char: "🗞",
        },
        newspaper: {
          keywords: ["press", "headline"],
          char: "📰",
        },
        notebook: {
          keywords: ["stationery", "record", "notes", "paper", "study"],
          char: "📓",
        },
        closed_book: {
          keywords: ["read", "library", "knowledge", "textbook", "learn"],
          char: "📕",
        },
        green_book: {
          keywords: ["read", "library", "knowledge", "study"],
          char: "📗",
        },
        blue_book: {
          keywords: ["read", "library", "knowledge", "learn", "study"],
          char: "📘",
        },
        orange_book: {
          keywords: ["read", "library", "knowledge", "textbook", "study"],
          char: "📙",
        },
        notebook_with_decorative_cover: {
          keywords: ["classroom", "notes", "record", "paper", "study"],
          char: "📔",
        },
        ledger: {
          keywords: ["notes", "paper"],
          char: "📒",
        },
        books: {
          keywords: ["literature", "library", "study"],
          char: "📚",
        },
        open_book: {
          keywords: [
            "book",
            "read",
            "library",
            "knowledge",
            "literature",
            "learn",
            "study",
          ],
          char: "📖",
        },
        safety_pin: {
          keywords: ["diaper"],
          char: "🧷",
        },
        link: {
          keywords: ["rings", "url"],
          char: "🔗",
        },
        paperclip: {
          keywords: ["documents", "stationery"],
          char: "📎",
        },
        paperclips: {
          keywords: ["documents", "stationery"],
          char: "🖇",
        },
        scissors: {
          keywords: ["stationery", "cut"],
          char: "✂️",
        },
        triangular_ruler: {
          keywords: ["stationery", "math", "architect", "sketch"],
          char: "📐",
        },
        straight_ruler: {
          keywords: [
            "stationery",
            "calculate",
            "length",
            "math",
            "school",
            "drawing",
            "architect",
            "sketch",
          ],
          char: "📏",
        },
        abacus: {
          keywords: ["calculation"],
          char: "🧮",
        },
        pushpin: {
          keywords: ["stationery", "mark", "here"],
          char: "📌",
        },
        round_pushpin: {
          keywords: ["stationery", "location", "map", "here"],
          char: "📍",
        },
        triangular_flag_on_post: {
          keywords: ["mark", "milestone", "place"],
          char: "🚩",
        },
        white_flag: {
          keywords: ["losing", "loser", "lost", "surrender", "give up", "fail"],
          char: "🏳",
        },
        black_flag: {
          keywords: ["pirate"],
          char: "🏴",
        },
        rainbow_flag: {
          keywords: [
            "flag",
            "rainbow",
            "pride",
            "gay",
            "lgbt",
            "glbt",
            "queer",
            "homosexual",
            "lesbian",
            "bisexual",
            "transgender",
          ],
          char: "🏳️‍🌈",
        },
        closed_lock_with_key: {
          keywords: ["security", "privacy"],
          char: "🔐",
        },
        lock: {
          keywords: ["security", "password", "padlock"],
          char: "🔒",
        },
        unlock: {
          keywords: ["privacy", "security"],
          char: "🔓",
        },
        lock_with_ink_pen: {
          keywords: ["security", "secret"],
          char: "🔏",
        },
        pen: {
          keywords: ["stationery", "writing", "write"],
          char: "🖊",
        },
        fountain_pen: {
          keywords: ["stationery", "writing", "write"],
          char: "🖋",
        },
        black_nib: {
          keywords: ["pen", "stationery", "writing", "write"],
          char: "✒️",
        },
        memo: {
          keywords: [
            "write",
            "documents",
            "stationery",
            "pencil",
            "paper",
            "writing",
            "legal",
            "exam",
            "quiz",
            "test",
            "study",
            "compose",
          ],
          char: "📝",
        },
        pencil2: {
          keywords: [
            "stationery",
            "write",
            "paper",
            "writing",
            "school",
            "study",
          ],
          char: "✏️",
        },
        crayon: {
          keywords: ["drawing", "creativity"],
          char: "🖍",
        },
        paintbrush: {
          keywords: ["drawing", "creativity", "art"],
          char: "🖌",
        },
        mag: {
          keywords: ["search", "zoom", "find", "detective"],
          char: "🔍",
        },
        mag_right: {
          keywords: ["search", "zoom", "find", "detective"],
          char: "🔎",
        },
      },
    },
  },

  {
    symbols: {
      id: "symbols",
      name: "Symbols",
      symbol: Symbols,
      emojis: {
        heart: {
          keywords: ["love", "like", "valentines"],
          char: "❤️",
        },
        orange_heart: {
          keywords: ["love", "like", "affection", "valentines"],
          char: "🧡",
        },
        yellow_heart: {
          keywords: ["love", "like", "affection", "valentines"],
          char: "💛",
        },
        green_heart: {
          keywords: ["love", "like", "affection", "valentines"],
          char: "💚",
        },
        blue_heart: {
          keywords: ["love", "like", "affection", "valentines"],
          char: "💙",
        },
        purple_heart: {
          keywords: ["love", "like", "affection", "valentines"],
          char: "💜",
        },
        black_heart: {
          keywords: ["evil"],
          char: "🖤",
        },
        broken_heart: {
          keywords: ["sad", "sorry", "break", "heart", "heartbreak"],
          char: "💔",
        },
        heavy_heart_exclamation: {
          keywords: ["decoration", "love"],
          char: "❣",
        },
        two_hearts: {
          keywords: ["love", "like", "affection", "valentines", "heart"],
          char: "💕",
        },
        revolving_hearts: {
          keywords: ["love", "like", "affection", "valentines"],
          char: "💞",
        },
        heartbeat: {
          keywords: [
            "love",
            "like",
            "affection",
            "valentines",
            "pink",
            "heart",
          ],
          char: "💓",
        },
        heartpulse: {
          keywords: ["like", "love", "affection", "valentines", "pink"],
          char: "💗",
        },
        sparkling_heart: {
          keywords: ["love", "like", "affection", "valentines"],
          char: "💖",
        },
        cupid: {
          keywords: ["love", "like", "heart", "affection", "valentines"],
          char: "💘",
        },
        gift_heart: {
          keywords: ["love", "valentines"],
          char: "💝",
        },
        heart_decoration: {
          keywords: ["purple-square", "love", "like"],
          char: "💟",
        },
        peace_symbol: {
          keywords: ["hippie"],
          char: "☮",
        },
        latin_cross: {
          keywords: ["christianity"],
          char: "✝",
        },
        star_and_crescent: {
          keywords: ["islam"],
          char: "☪",
        },
        om: {
          keywords: ["hinduism", "buddhism", "sikhism", "jainism"],
          char: "🕉",
        },
        wheel_of_dharma: {
          keywords: ["hinduism", "buddhism", "sikhism", "jainism"],
          char: "☸",
        },
        star_of_david: {
          keywords: ["judaism"],
          char: "✡",
        },
        six_pointed_star: {
          keywords: ["purple-square", "religion", "jewish", "hexagram"],
          char: "🔯",
        },
        menorah: {
          keywords: ["hanukkah", "candles", "jewish"],
          char: "🕎",
        },
        yin_yang: {
          keywords: ["balance"],
          char: "☯",
        },
        orthodox_cross: {
          keywords: ["suppedaneum", "religion"],
          char: "☦",
        },
        place_of_worship: {
          keywords: ["religion", "church", "temple", "prayer"],
          char: "🛐",
        },
        ophiuchus: {
          keywords: ["sign", "purple-square", "constellation", "astrology"],
          char: "⛎",
        },
        aries: {
          keywords: ["sign", "purple-square", "zodiac", "astrology"],
          char: "♈",
        },
        taurus: {
          keywords: ["purple-square", "sign", "zodiac", "astrology"],
          char: "♉",
        },
        gemini: {
          keywords: ["sign", "zodiac", "purple-square", "astrology"],
          char: "♊",
        },
        cancer: {
          keywords: ["sign", "zodiac", "purple-square", "astrology"],
          char: "♋",
        },
        leo: {
          keywords: ["sign", "purple-square", "zodiac", "astrology"],
          char: "♌",
        },
        virgo: {
          keywords: ["sign", "zodiac", "purple-square", "astrology"],
          char: "♍",
        },
        libra: {
          keywords: ["sign", "purple-square", "zodiac", "astrology"],
          char: "♎",
        },
        scorpius: {
          keywords: ["sign", "zodiac", "purple-square", "astrology", "scorpio"],
          char: "♏",
        },
        sagittarius: {
          keywords: ["sign", "zodiac", "purple-square", "astrology"],
          char: "♐",
        },
        capricorn: {
          keywords: ["sign", "zodiac", "purple-square", "astrology"],
          char: "♑",
        },
        aquarius: {
          keywords: ["sign", "purple-square", "zodiac", "astrology"],
          char: "♒",
        },
        pisces: {
          keywords: ["purple-square", "sign", "zodiac", "astrology"],
          char: "♓",
        },
        id: {
          keywords: ["purple-square", "words"],
          char: "🆔",
        },
        atom_symbol: {
          keywords: ["science", "physics", "chemistry"],
          char: "⚛",
        },
        u7a7a: {
          keywords: [
            "kanji",
            "japanese",
            "chinese",
            "empty",
            "sky",
            "blue-square",
          ],
          char: "🈳",
        },
        u5272: {
          keywords: ["cut", "divide", "chinese", "kanji", "pink-square"],
          char: "🈹",
        },
        radioactive: {
          keywords: ["nuclear", "danger"],
          char: "☢",
        },
        biohazard: {
          keywords: ["danger"],
          char: "☣",
        },
        mobile_phone_off: {
          keywords: ["mute", "orange-square", "silence", "quiet"],
          char: "📴",
        },
        vibration_mode: {
          keywords: ["orange-square", "phone"],
          char: "📳",
        },
        u6709: {
          keywords: ["orange-square", "chinese", "have", "kanji"],
          char: "🈶",
        },
        u7121: {
          keywords: [
            "nothing",
            "chinese",
            "kanji",
            "japanese",
            "orange-square",
          ],
          char: "🈚",
        },
        u7533: {
          keywords: ["chinese", "japanese", "kanji", "orange-square"],
          char: "🈸",
        },
        u55b6: {
          keywords: ["japanese", "opening hours", "orange-square"],
          char: "🈺",
        },
        u6708: {
          keywords: [
            "chinese",
            "month",
            "moon",
            "japanese",
            "orange-square",
            "kanji",
          ],
          char: "🈷️",
        },
        eight_pointed_black_star: {
          keywords: ["orange-square", "shape", "polygon"],
          char: "✴️",
        },
        vs: {
          keywords: ["words", "orange-square"],
          char: "🆚",
        },
        accept: {
          keywords: [
            "ok",
            "good",
            "chinese",
            "kanji",
            "agree",
            "yes",
            "orange-circle",
          ],
          char: "🉑",
        },
        white_flower: {
          keywords: ["japanese", "spring"],
          char: "💮",
        },
        ideograph_advantage: {
          keywords: ["chinese", "kanji", "obtain", "get", "circle"],
          char: "🉐",
        },
        secret: {
          keywords: ["privacy", "chinese", "sshh", "kanji", "red-circle"],
          char: "㊙️",
        },
        congratulations: {
          keywords: ["chinese", "kanji", "japanese", "red-circle"],
          char: "㊗️",
        },
        u5408: {
          keywords: ["japanese", "chinese", "join", "kanji", "red-square"],
          char: "🈴",
        },
        u6e80: {
          keywords: ["full", "chinese", "japanese", "red-square", "kanji"],
          char: "🈵",
        },
        u7981: {
          keywords: [
            "kanji",
            "japanese",
            "chinese",
            "forbidden",
            "limit",
            "restricted",
            "red-square",
          ],
          char: "🈲",
        },
        a: {
          keywords: ["red-square", "alphabet", "letter"],
          char: "🅰️",
        },
        b: {
          keywords: ["red-square", "alphabet", "letter"],
          char: "🅱️",
        },
        ab: {
          keywords: ["red-square", "alphabet"],
          char: "🆎",
        },
        cl: {
          keywords: ["alphabet", "words", "red-square"],
          char: "🆑",
        },
        o2: {
          keywords: ["alphabet", "red-square", "letter"],
          char: "🅾️",
        },
        sos: {
          keywords: ["help", "red-square", "words", "emergency", "911"],
          char: "🆘",
        },
        no_entry: {
          keywords: [
            "limit",
            "security",
            "privacy",
            "bad",
            "denied",
            "stop",
            "circle",
          ],
          char: "⛔",
        },
        name_badge: {
          keywords: ["fire", "forbid"],
          char: "📛",
        },
        no_entry_sign: {
          keywords: ["forbid", "stop", "limit", "denied", "disallow", "circle"],
          char: "🚫",
        },
        x: {
          keywords: ["no", "delete", "remove", "cancel", "red"],
          char: "❌",
        },
        o: {
          keywords: ["circle", "round"],
          char: "⭕",
        },
        stop_sign: {
          keywords: ["stop"],
          char: "🛑",
        },
        anger: {
          keywords: ["angry", "mad"],
          char: "💢",
        },
        hotsprings: {
          keywords: ["bath", "warm", "relax"],
          char: "♨️",
        },
        no_pedestrians: {
          keywords: ["rules", "crossing", "walking", "circle"],
          char: "🚷",
        },
        do_not_litter: {
          keywords: ["trash", "bin", "garbage", "circle"],
          char: "🚯",
        },
        no_bicycles: {
          keywords: ["cyclist", "prohibited", "circle"],
          char: "🚳",
        },
        "non-potable_water": {
          keywords: ["drink", "faucet", "tap", "circle"],
          char: "🚱",
        },
        underage: {
          keywords: ["18", "drink", "pub", "night", "minor", "circle"],
          char: "🔞",
        },
        no_mobile_phones: {
          keywords: ["iphone", "mute", "circle"],
          char: "📵",
        },
        exclamation: {
          keywords: [
            "heavy_exclamation_mark",
            "danger",
            "surprise",
            "punctuation",
            "wow",
            "warning",
          ],
          char: "❗",
        },
        grey_exclamation: {
          keywords: ["surprise", "punctuation", "gray", "wow", "warning"],
          char: "❕",
        },
        question: {
          keywords: ["doubt", "confused"],
          char: "❓",
        },
        grey_question: {
          keywords: ["doubts", "gray", "huh", "confused"],
          char: "❔",
        },
        bangbang: {
          keywords: ["exclamation", "surprise"],
          char: "‼️",
        },
        interrobang: {
          keywords: ["wat", "punctuation", "surprise"],
          char: "⁉️",
        },
        100: {
          keywords: [
            "score",
            "perfect",
            "numbers",
            "century",
            "exam",
            "quiz",
            "test",
            "pass",
            "hundred",
          ],
          char: "💯",
        },
        low_brightness: {
          keywords: ["sun", "afternoon", "warm", "summer"],
          char: "🔅",
        },
        high_brightness: {
          keywords: ["sun", "light"],
          char: "🔆",
        },
        trident: {
          keywords: ["weapon", "spear"],
          char: "🔱",
        },
        fleur_de_lis: {
          keywords: ["decorative", "scout"],
          char: "⚜",
        },
        part_alternation_mark: {
          keywords: [
            "graph",
            "presentation",
            "stats",
            "business",
            "economics",
            "bad",
          ],
          char: "〽️",
        },
        warning: {
          keywords: [
            "exclamation",
            "wip",
            "alert",
            "error",
            "problem",
            "issue",
          ],
          char: "⚠️",
        },
        children_crossing: {
          keywords: [
            "school",
            "warning",
            "danger",
            "sign",
            "driving",
            "yellow-diamond",
          ],
          char: "🚸",
        },
        beginner: {
          keywords: ["badge", "shield"],
          char: "🔰",
        },
        recycle: {
          keywords: ["arrow", "environment", "garbage", "trash"],
          char: "♻️",
        },
        u6307: {
          keywords: ["chinese", "point", "green-square", "kanji"],
          char: "🈯",
        },
        chart: {
          keywords: ["green-square", "graph", "presentation", "stats"],
          char: "💹",
        },
        sparkle: {
          keywords: ["stars", "green-square", "awesome", "good", "fireworks"],
          char: "❇️",
        },
        eight_spoked_asterisk: {
          keywords: ["star", "sparkle", "green-square"],
          char: "✳️",
        },
        negative_squared_cross_mark: {
          keywords: ["x", "green-square", "no", "deny"],
          char: "❎",
        },
        white_check_mark: {
          keywords: [
            "green-square",
            "ok",
            "agree",
            "vote",
            "election",
            "answer",
            "tick",
          ],
          char: "✅",
        },
        diamond_shape_with_a_dot_inside: {
          keywords: ["jewel", "blue", "gem", "crystal", "fancy"],
          char: "💠",
        },
        cyclone: {
          keywords: [
            "weather",
            "swirl",
            "blue",
            "cloud",
            "vortex",
            "spiral",
            "whirlpool",
            "spin",
            "tornado",
            "hurricane",
            "typhoon",
          ],
          char: "🌀",
        },
        loop: {
          keywords: ["tape", "cassette"],
          char: "➿",
        },
        globe_with_meridians: {
          keywords: [
            "earth",
            "international",
            "world",
            "internet",
            "interweb",
            "i18n",
          ],
          char: "🌐",
        },
        m: {
          keywords: ["alphabet", "blue-circle", "letter"],
          char: "Ⓜ️",
        },
        atm: {
          keywords: [
            "money",
            "sales",
            "cash",
            "blue-square",
            "payment",
            "bank",
          ],
          char: "🏧",
        },
        sa: {
          keywords: ["japanese", "blue-square", "katakana"],
          char: "🈂️",
        },
        passport_control: {
          keywords: ["custom", "blue-square"],
          char: "🛂",
        },
        customs: {
          keywords: ["passport", "border", "blue-square"],
          char: "🛃",
        },
        baggage_claim: {
          keywords: ["blue-square", "airport", "transport"],
          char: "🛄",
        },
        left_luggage: {
          keywords: ["blue-square", "travel"],
          char: "🛅",
        },
        wheelchair: {
          keywords: ["blue-square", "disabled", "a11y", "accessibility"],
          char: "♿",
        },
        no_smoking: {
          keywords: ["cigarette", "blue-square", "smell", "smoke"],
          char: "🚭",
        },
        wc: {
          keywords: ["toilet", "restroom", "blue-square"],
          char: "🚾",
        },
        parking: {
          keywords: ["cars", "blue-square", "alphabet", "letter"],
          char: "🅿️",
        },
        potable_water: {
          keywords: ["blue-square", "liquid", "restroom", "cleaning", "faucet"],
          char: "🚰",
        },
        mens: {
          keywords: [
            "toilet",
            "restroom",
            "wc",
            "blue-square",
            "gender",
            "male",
          ],
          char: "🚹",
        },
        womens: {
          keywords: [
            "purple-square",
            "woman",
            "female",
            "toilet",
            "loo",
            "restroom",
            "gender",
          ],
          char: "🚺",
        },
        baby_symbol: {
          keywords: ["orange-square", "child"],
          char: "🚼",
        },
        restroom: {
          keywords: ["blue-square", "toilet", "refresh", "wc", "gender"],
          char: "🚻",
        },
        put_litter_in_its_place: {
          keywords: ["blue-square", "sign", "human", "info"],
          char: "🚮",
        },
        cinema: {
          keywords: [
            "blue-square",
            "record",
            "film",
            "movie",
            "curtain",
            "stage",
            "theater",
          ],
          char: "🎦",
        },
        signal_strength: {
          keywords: [
            "blue-square",
            "reception",
            "phone",
            "internet",
            "connection",
            "wifi",
            "bluetooth",
            "bars",
          ],
          char: "📶",
        },
        koko: {
          keywords: [
            "blue-square",
            "here",
            "katakana",
            "japanese",
            "destination",
          ],
          char: "🈁",
        },
        ng: {
          keywords: ["blue-square", "words", "shape", "icon"],
          char: "🆖",
        },
        ok: {
          keywords: ["good", "agree", "yes", "blue-square"],
          char: "🆗",
        },
        up: {
          keywords: ["blue-square", "above", "high"],
          char: "🆙",
        },
        cool: {
          keywords: ["words", "blue-square"],
          char: "🆒",
        },
        new: {
          keywords: ["blue-square", "words", "start"],
          char: "🆕",
        },
        free: {
          keywords: ["blue-square", "words"],
          char: "🆓",
        },
        zero: {
          keywords: ["0", "numbers", "blue-square", "null"],
          char: "0️⃣",
        },
        one: {
          keywords: ["blue-square", "numbers", "1"],
          char: "1️⃣",
        },
        two: {
          keywords: ["numbers", "2", "prime", "blue-square"],
          char: "2️⃣",
        },
        three: {
          keywords: ["3", "numbers", "prime", "blue-square"],
          char: "3️⃣",
        },
        four: {
          keywords: ["4", "numbers", "blue-square"],
          char: "4️⃣",
        },
        five: {
          keywords: ["5", "numbers", "blue-square", "prime"],
          char: "5️⃣",
        },
        six: {
          keywords: ["6", "numbers", "blue-square"],
          char: "6️⃣",
        },
        seven: {
          keywords: ["7", "numbers", "blue-square", "prime"],
          char: "7️⃣",
        },
        eight: {
          keywords: ["8", "blue-square", "numbers"],
          char: "8️⃣",
        },
        nine: {
          keywords: ["blue-square", "numbers", "9"],
          char: "9️⃣",
        },
        keycap_ten: {
          keywords: ["numbers", "10", "blue-square"],
          char: "🔟",
        },
        asterisk: {
          keywords: ["star", "keycap"],
          char: "*⃣",
        },
        1234: {
          keywords: ["numbers", "blue-square"],
          char: "🔢",
        },
        eject_button: {
          keywords: ["blue-square"],
          char: "⏏️",
        },
        arrow_forward: {
          keywords: ["blue-square", "right", "direction", "play"],
          char: "▶️",
        },
        pause_button: {
          keywords: ["pause", "blue-square"],
          char: "⏸",
        },
        next_track_button: {
          keywords: ["forward", "next", "blue-square"],
          char: "⏭",
        },
        stop_button: {
          keywords: ["blue-square"],
          char: "⏹",
        },
        record_button: {
          keywords: ["blue-square"],
          char: "⏺",
        },
        play_or_pause_button: {
          keywords: ["blue-square", "play", "pause"],
          char: "⏯",
        },
        previous_track_button: {
          keywords: ["backward"],
          char: "⏮",
        },
        fast_forward: {
          keywords: ["blue-square", "play", "speed", "continue"],
          char: "⏩",
        },
        rewind: {
          keywords: ["play", "blue-square"],
          char: "⏪",
        },
        twisted_rightwards_arrows: {
          keywords: ["blue-square", "shuffle", "music", "random"],
          char: "🔀",
        },
        repeat: {
          keywords: ["loop", "record"],
          char: "🔁",
        },
        repeat_one: {
          keywords: ["blue-square", "loop"],
          char: "🔂",
        },
        arrow_backward: {
          keywords: ["blue-square", "left", "direction"],
          char: "◀️",
        },
        arrow_up_small: {
          keywords: [
            "blue-square",
            "triangle",
            "direction",
            "point",
            "forward",
            "top",
          ],
          char: "🔼",
        },
        arrow_down_small: {
          keywords: ["blue-square", "direction", "bottom"],
          char: "🔽",
        },
        arrow_double_up: {
          keywords: ["blue-square", "direction", "top"],
          char: "⏫",
        },
        arrow_double_down: {
          keywords: ["blue-square", "direction", "bottom"],
          char: "⏬",
        },
        arrow_right: {
          keywords: ["blue-square", "next"],
          char: "➡️",
        },
        arrow_left: {
          keywords: ["blue-square", "previous", "back"],
          char: "⬅️",
        },
        arrow_up: {
          keywords: ["blue-square", "continue", "top", "direction"],
          char: "⬆️",
        },
        arrow_down: {
          keywords: ["blue-square", "direction", "bottom"],
          char: "⬇️",
        },
        arrow_upper_right: {
          keywords: [
            "blue-square",
            "point",
            "direction",
            "diagonal",
            "northeast",
          ],
          char: "↗️",
        },
        arrow_lower_right: {
          keywords: ["blue-square", "direction", "diagonal", "southeast"],
          char: "↘️",
        },
        arrow_lower_left: {
          keywords: ["blue-square", "direction", "diagonal", "southwest"],
          char: "↙️",
        },
        arrow_upper_left: {
          keywords: [
            "blue-square",
            "point",
            "direction",
            "diagonal",
            "northwest",
          ],
          char: "↖️",
        },
        arrow_up_down: {
          keywords: ["blue-square", "direction", "way", "vertical"],
          char: "↕️",
        },
        left_right_arrow: {
          keywords: ["shape", "direction", "horizontal", "sideways"],
          char: "↔️",
        },
        arrows_counterclockwise: {
          keywords: ["blue-square", "sync", "cycle"],
          char: "🔄",
        },
        arrow_right_hook: {
          keywords: ["blue-square", "return", "rotate", "direction"],
          char: "↪️",
        },
        leftwards_arrow_with_hook: {
          keywords: ["back", "return", "blue-square", "undo", "enter"],
          char: "↩️",
        },
        arrow_heading_up: {
          keywords: ["blue-square", "direction", "top"],
          char: "⤴️",
        },
        arrow_heading_down: {
          keywords: ["blue-square", "direction", "bottom"],
          char: "⤵️",
        },
        hash: {
          keywords: ["symbol", "blue-square", "twitter"],
          char: "#️⃣",
        },
        information_source: {
          keywords: ["blue-square", "alphabet", "letter"],
          char: "ℹ️",
        },
        abc: {
          keywords: ["blue-square", "alphabet"],
          char: "🔤",
        },
        abcd: {
          keywords: ["blue-square", "alphabet"],
          char: "🔡",
        },
        capital_abcd: {
          keywords: ["alphabet", "words", "blue-square"],
          char: "🔠",
        },
        symbols: {
          keywords: [
            "blue-square",
            "music",
            "note",
            "ampersand",
            "percent",
            "glyphs",
            "characters",
          ],
          char: "🔣",
        },
        musical_note: {
          keywords: ["score", "tone", "sound"],
          char: "🎵",
        },
        notes: {
          keywords: ["music", "score"],
          char: "🎶",
        },
        wavy_dash: {
          keywords: [
            "draw",
            "line",
            "moustache",
            "mustache",
            "squiggle",
            "scribble",
          ],
          char: "〰️",
        },
        curly_loop: {
          keywords: ["scribble", "draw", "shape", "squiggle"],
          char: "➰",
        },
        heavy_check_mark: {
          keywords: ["ok", "nike", "answer", "yes", "tick"],
          char: "✔️",
        },
        arrows_clockwise: {
          keywords: ["sync", "cycle", "round", "repeat"],
          char: "🔃",
        },
        heavy_plus_sign: {
          keywords: ["math", "calculation", "addition", "more", "increase"],
          char: "➕",
        },
        heavy_minus_sign: {
          keywords: ["math", "calculation", "subtract", "less"],
          char: "➖",
        },
        heavy_division_sign: {
          keywords: ["divide", "math", "calculation"],
          char: "➗",
        },
        heavy_multiplication_x: {
          keywords: ["math", "calculation"],
          char: "✖️",
        },
        infinity: {
          keywords: ["forever"],
          char: "♾",
        },
        heavy_dollar_sign: {
          keywords: ["money", "sales", "payment", "currency", "buck"],
          char: "💲",
        },
        currency_exchange: {
          keywords: ["money", "sales", "dollar", "travel"],
          char: "💱",
        },
        copyright: {
          keywords: ["ip", "license", "circle", "law", "legal"],
          char: "©️",
        },
        registered: {
          keywords: ["alphabet", "circle"],
          char: "®️",
        },
        tm: {
          keywords: ["trademark", "brand", "law", "legal"],
          char: "™️",
        },
        end: {
          keywords: ["words", "arrow"],
          char: "🔚",
        },
        back: {
          keywords: ["arrow", "words", "return"],
          char: "🔙",
        },
        on: {
          keywords: ["arrow", "words"],
          char: "🔛",
        },
        top: {
          keywords: ["words", "blue-square"],
          char: "🔝",
        },
        soon: {
          keywords: ["arrow", "words"],
          char: "🔜",
        },
        ballot_box_with_check: {
          keywords: [
            "ok",
            "agree",
            "confirm",
            "black-square",
            "vote",
            "election",
            "yes",
            "tick",
          ],
          char: "☑️",
        },
        radio_button: {
          keywords: ["input", "old", "music", "circle"],
          char: "🔘",
        },
        white_circle: {
          keywords: ["shape", "round"],
          char: "⚪",
        },
        black_circle: {
          keywords: ["shape", "button", "round"],
          char: "⚫",
        },
        red_circle: {
          keywords: ["shape", "error", "danger"],
          char: "🔴",
        },
        large_blue_circle: {
          keywords: ["shape", "icon", "button"],
          char: "🔵",
        },
        small_orange_diamond: {
          keywords: ["shape", "jewel", "gem"],
          char: "🔸",
        },
        small_blue_diamond: {
          keywords: ["shape", "jewel", "gem"],
          char: "🔹",
        },
        large_orange_diamond: {
          keywords: ["shape", "jewel", "gem"],
          char: "🔶",
        },
        large_blue_diamond: {
          keywords: ["shape", "jewel", "gem"],
          char: "🔷",
        },
        small_red_triangle: {
          keywords: ["shape", "direction", "up", "top"],
          char: "🔺",
        },
        black_small_square: {
          keywords: ["shape", "icon"],
          char: "▪️",
        },
        white_small_square: {
          keywords: ["shape", "icon"],
          char: "▫️",
        },
        black_large_square: {
          keywords: ["shape", "icon", "button"],
          char: "⬛",
        },
        white_large_square: {
          keywords: ["shape", "icon", "stone", "button"],
          char: "⬜",
        },
        small_red_triangle_down: {
          keywords: ["shape", "direction", "bottom"],
          char: "🔻",
        },
        black_medium_square: {
          keywords: ["shape", "button", "icon"],
          char: "◼️",
        },
        white_medium_square: {
          keywords: ["shape", "stone", "icon"],
          char: "◻️",
        },
        black_medium_small_square: {
          keywords: ["icon", "shape", "button"],
          char: "◾",
        },
        white_medium_small_square: {
          keywords: ["shape", "stone", "icon", "button"],
          char: "◽",
        },
        black_square_button: {
          keywords: ["shape", "input", "frame"],
          char: "🔲",
        },
        white_square_button: {
          keywords: ["shape", "input"],
          char: "🔳",
        },
        speaker: {
          keywords: ["sound", "volume", "silence", "broadcast"],
          char: "🔈",
        },
        sound: {
          keywords: ["volume", "speaker", "broadcast"],
          char: "🔉",
        },
        loud_sound: {
          keywords: ["volume", "noise", "noisy", "speaker", "broadcast"],
          char: "🔊",
        },
        mute: {
          keywords: ["sound", "volume", "silence", "quiet"],
          char: "🔇",
        },
        mega: {
          keywords: ["sound", "speaker", "volume"],
          char: "📣",
        },
        loudspeaker: {
          keywords: ["volume", "sound"],
          char: "📢",
        },
        bell: {
          keywords: ["sound", "notification", "christmas", "xmas", "chime"],
          char: "🔔",
        },
        no_bell: {
          keywords: ["sound", "volume", "mute", "quiet", "silent"],
          char: "🔕",
        },
        black_joker: {
          keywords: ["poker", "cards", "game", "play", "magic"],
          char: "🃏",
        },
        mahjong: {
          keywords: ["game", "play", "chinese", "kanji"],
          char: "🀄",
        },
        spades: {
          keywords: ["poker", "cards", "suits", "magic"],
          char: "♠️",
        },
        clubs: {
          keywords: ["poker", "cards", "magic", "suits"],
          char: "♣️",
        },
        hearts: {
          keywords: ["poker", "cards", "magic", "suits"],
          char: "♥️",
        },
        diamonds: {
          keywords: ["poker", "cards", "magic", "suits"],
          char: "♦️",
        },
        flower_playing_cards: {
          keywords: ["game", "sunset", "red"],
          char: "🎴",
        },
        thought_balloon: {
          keywords: ["bubble", "cloud", "speech", "thinking", "dream"],
          char: "💭",
        },
        right_anger_bubble: {
          keywords: ["caption", "speech", "thinking", "mad"],
          char: "🗯",
        },
        speech_balloon: {
          keywords: ["bubble", "words", "message", "talk", "chatting"],
          char: "💬",
        },
        left_speech_bubble: {
          keywords: ["words", "message", "talk", "chatting"],
          char: "🗨",
        },
        clock1: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕐",
        },
        clock2: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕑",
        },
        clock3: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕒",
        },
        clock4: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕓",
        },
        clock5: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕔",
        },
        clock6: {
          keywords: ["time", "late", "early", "schedule", "dawn", "dusk"],
          char: "🕕",
        },
        clock7: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕖",
        },
        clock8: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕗",
        },
        clock9: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕘",
        },
        clock10: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕙",
        },
        clock11: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕚",
        },
        clock12: {
          keywords: [
            "time",
            "noon",
            "midnight",
            "midday",
            "late",
            "early",
            "schedule",
          ],
          char: "🕛",
        },
        clock130: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕜",
        },
        clock230: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕝",
        },
        clock330: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕞",
        },
        clock430: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕟",
        },
        clock530: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕠",
        },
        clock630: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕡",
        },
        clock730: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕢",
        },
        clock830: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕣",
        },
        clock930: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕤",
        },
        clock1030: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕥",
        },
        clock1130: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕦",
        },
        clock1230: {
          keywords: ["time", "late", "early", "schedule"],
          char: "🕧",
        },
      },
    },
  },

  {
    flags: {
      id: "flags",
      name: "Flags",
      symbol: Flags,
      emojis: {
        afghanistan: {
          keywords: ["af", "flag", "nation", "country", "banner"],
          char: "🇦🇫",
        },
        aland_islands: {
          keywords: ["Åland", "islands", "flag", "nation", "country", "banner"],
          char: "🇦🇽",
        },
        albania: {
          keywords: ["al", "flag", "nation", "country", "banner"],
          char: "🇦🇱",
        },
        algeria: {
          keywords: ["dz", "flag", "nation", "country", "banner"],
          char: "🇩🇿",
        },
        american_samoa: {
          keywords: ["american", "ws", "flag", "nation", "country", "banner"],
          char: "🇦🇸",
        },
        andorra: {
          keywords: ["ad", "flag", "nation", "country", "banner"],
          char: "🇦🇩",
        },
        angola: {
          keywords: ["ao", "flag", "nation", "country", "banner"],
          char: "🇦🇴",
        },
        anguilla: {
          keywords: ["ai", "flag", "nation", "country", "banner"],
          char: "🇦🇮",
        },
        antarctica: {
          keywords: ["aq", "flag", "nation", "country", "banner"],
          char: "🇦🇶",
        },
        antigua_barbuda: {
          keywords: [
            "antigua",
            "barbuda",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇦🇬",
        },
        argentina: {
          keywords: ["ar", "flag", "nation", "country", "banner"],
          char: "🇦🇷",
        },
        armenia: {
          keywords: ["am", "flag", "nation", "country", "banner"],
          char: "🇦🇲",
        },
        aruba: {
          keywords: ["aw", "flag", "nation", "country", "banner"],
          char: "🇦🇼",
        },
        australia: {
          keywords: ["au", "flag", "nation", "country", "banner"],
          char: "🇦🇺",
        },
        austria: {
          keywords: ["at", "flag", "nation", "country", "banner"],
          char: "🇦🇹",
        },
        azerbaijan: {
          keywords: ["az", "flag", "nation", "country", "banner"],
          char: "🇦🇿",
        },
        bahamas: {
          keywords: ["bs", "flag", "nation", "country", "banner"],
          char: "🇧🇸",
        },
        bahrain: {
          keywords: ["bh", "flag", "nation", "country", "banner"],
          char: "🇧🇭",
        },
        bangladesh: {
          keywords: ["bd", "flag", "nation", "country", "banner"],
          char: "🇧🇩",
        },
        barbados: {
          keywords: ["bb", "flag", "nation", "country", "banner"],
          char: "🇧🇧",
        },
        belarus: {
          keywords: ["by", "flag", "nation", "country", "banner"],
          char: "🇧🇾",
        },
        belgium: {
          keywords: ["be", "flag", "nation", "country", "banner"],
          char: "🇧🇪",
        },
        belize: {
          keywords: ["bz", "flag", "nation", "country", "banner"],
          char: "🇧🇿",
        },
        benin: {
          keywords: ["bj", "flag", "nation", "country", "banner"],
          char: "🇧🇯",
        },
        bermuda: {
          keywords: ["bm", "flag", "nation", "country", "banner"],
          char: "🇧🇲",
        },
        bhutan: {
          keywords: ["bt", "flag", "nation", "country", "banner"],
          char: "🇧🇹",
        },
        bolivia: {
          keywords: ["bo", "flag", "nation", "country", "banner"],
          char: "🇧🇴",
        },
        caribbean_netherlands: {
          keywords: ["bonaire", "flag", "nation", "country", "banner"],
          char: "🇧🇶",
        },
        bosnia_herzegovina: {
          keywords: [
            "bosnia",
            "herzegovina",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇧🇦",
        },
        botswana: {
          keywords: ["bw", "flag", "nation", "country", "banner"],
          char: "🇧🇼",
        },
        brazil: {
          keywords: ["br", "flag", "nation", "country", "banner"],
          char: "🇧🇷",
        },
        british_indian_ocean_territory: {
          keywords: [
            "british",
            "indian",
            "ocean",
            "territory",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇮🇴",
        },
        british_virgin_islands: {
          keywords: [
            "british",
            "virgin",
            "islands",
            "bvi",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇻🇬",
        },
        brunei: {
          keywords: ["bn", "darussalam", "flag", "nation", "country", "banner"],
          char: "🇧🇳",
        },
        bulgaria: {
          keywords: ["bg", "flag", "nation", "country", "banner"],
          char: "🇧🇬",
        },
        burkina_faso: {
          keywords: ["burkina", "faso", "flag", "nation", "country", "banner"],
          char: "🇧🇫",
        },
        burundi: {
          keywords: ["bi", "flag", "nation", "country", "banner"],
          char: "🇧🇮",
        },
        cape_verde: {
          keywords: ["cabo", "verde", "flag", "nation", "country", "banner"],
          char: "🇨🇻",
        },
        cambodia: {
          keywords: ["kh", "flag", "nation", "country", "banner"],
          char: "🇰🇭",
        },
        cameroon: {
          keywords: ["cm", "flag", "nation", "country", "banner"],
          char: "🇨🇲",
        },
        canada: {
          keywords: ["ca", "flag", "nation", "country", "banner"],
          char: "🇨🇦",
        },
        canary_islands: {
          keywords: [
            "canary",
            "islands",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇮🇨",
        },
        cayman_islands: {
          keywords: [
            "cayman",
            "islands",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇰🇾",
        },
        central_african_republic: {
          keywords: [
            "central",
            "african",
            "republic",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇨🇫",
        },
        chad: {
          keywords: ["td", "flag", "nation", "country", "banner"],
          char: "🇹🇩",
        },
        chile: {
          keywords: ["flag", "nation", "country", "banner"],
          char: "🇨🇱",
        },
        cn: {
          keywords: [
            "china",
            "chinese",
            "prc",
            "flag",
            "country",
            "nation",
            "banner",
          ],
          char: "🇨🇳",
        },
        christmas_island: {
          keywords: [
            "christmas",
            "island",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇨🇽",
        },
        cocos_islands: {
          keywords: [
            "cocos",
            "keeling",
            "islands",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇨🇨",
        },
        colombia: {
          keywords: ["co", "flag", "nation", "country", "banner"],
          char: "🇨🇴",
        },
        comoros: {
          keywords: ["km", "flag", "nation", "country", "banner"],
          char: "🇰🇲",
        },
        congo_brazzaville: {
          keywords: ["congo", "flag", "nation", "country", "banner"],
          char: "🇨🇬",
        },
        congo_kinshasa: {
          keywords: [
            "congo",
            "democratic",
            "republic",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇨🇩",
        },
        cook_islands: {
          keywords: ["cook", "islands", "flag", "nation", "country", "banner"],
          char: "🇨🇰",
        },
        costa_rica: {
          keywords: ["costa", "rica", "flag", "nation", "country", "banner"],
          char: "🇨🇷",
        },
        croatia: {
          keywords: ["hr", "flag", "nation", "country", "banner"],
          char: "🇭🇷",
        },
        cuba: {
          keywords: ["cu", "flag", "nation", "country", "banner"],
          char: "🇨🇺",
        },
        curacao: {
          keywords: ["curaçao", "flag", "nation", "country", "banner"],
          char: "🇨🇼",
        },
        cyprus: {
          keywords: ["cy", "flag", "nation", "country", "banner"],
          char: "🇨🇾",
        },
        czech_republic: {
          keywords: ["cz", "flag", "nation", "country", "banner"],
          char: "🇨🇿",
        },
        denmark: {
          keywords: ["dk", "flag", "nation", "country", "banner"],
          char: "🇩🇰",
        },
        djibouti: {
          keywords: ["dj", "flag", "nation", "country", "banner"],
          char: "🇩🇯",
        },
        dominica: {
          keywords: ["dm", "flag", "nation", "country", "banner"],
          char: "🇩🇲",
        },
        dominican_republic: {
          keywords: [
            "dominican",
            "republic",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇩🇴",
        },
        ecuador: {
          keywords: ["ec", "flag", "nation", "country", "banner"],
          char: "🇪🇨",
        },
        egypt: {
          keywords: ["eg", "flag", "nation", "country", "banner"],
          char: "🇪🇬",
        },
        el_salvador: {
          keywords: ["el", "salvador", "flag", "nation", "country", "banner"],
          char: "🇸🇻",
        },
        equatorial_guinea: {
          keywords: ["equatorial", "gn", "flag", "nation", "country", "banner"],
          char: "🇬🇶",
        },
        eritrea: {
          keywords: ["er", "flag", "nation", "country", "banner"],
          char: "🇪🇷",
        },
        estonia: {
          keywords: ["ee", "flag", "nation", "country", "banner"],
          char: "🇪🇪",
        },
        ethiopia: {
          keywords: ["et", "flag", "nation", "country", "banner"],
          char: "🇪🇹",
        },
        eu: {
          keywords: ["european", "union", "flag", "banner"],
          char: "🇪🇺",
        },
        falkland_islands: {
          keywords: [
            "falkland",
            "islands",
            "malvinas",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇫🇰",
        },
        faroe_islands: {
          keywords: ["faroe", "islands", "flag", "nation", "country", "banner"],
          char: "🇫🇴",
        },
        fiji: {
          keywords: ["fj", "flag", "nation", "country", "banner"],
          char: "🇫🇯",
        },
        finland: {
          keywords: ["fi", "flag", "nation", "country", "banner"],
          char: "🇫🇮",
        },
        fr: {
          keywords: ["banner", "flag", "nation", "france", "french", "country"],
          char: "🇫🇷",
        },
        french_guiana: {
          keywords: ["french", "guiana", "flag", "nation", "country", "banner"],
          char: "🇬🇫",
        },
        french_polynesia: {
          keywords: [
            "french",
            "polynesia",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇵🇫",
        },
        french_southern_territories: {
          keywords: [
            "french",
            "southern",
            "territories",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇹🇫",
        },
        gabon: {
          keywords: ["ga", "flag", "nation", "country", "banner"],
          char: "🇬🇦",
        },
        gambia: {
          keywords: ["gm", "flag", "nation", "country", "banner"],
          char: "🇬🇲",
        },
        georgia: {
          keywords: ["ge", "flag", "nation", "country", "banner"],
          char: "🇬🇪",
        },
        de: {
          keywords: ["german", "nation", "flag", "country", "banner"],
          char: "🇩🇪",
        },
        ghana: {
          keywords: ["gh", "flag", "nation", "country", "banner"],
          char: "🇬🇭",
        },
        gibraltar: {
          keywords: ["gi", "flag", "nation", "country", "banner"],
          char: "🇬🇮",
        },
        greece: {
          keywords: ["gr", "flag", "nation", "country", "banner"],
          char: "🇬🇷",
        },
        greenland: {
          keywords: ["gl", "flag", "nation", "country", "banner"],
          char: "🇬🇱",
        },
        grenada: {
          keywords: ["gd", "flag", "nation", "country", "banner"],
          char: "🇬🇩",
        },
        guadeloupe: {
          keywords: ["gp", "flag", "nation", "country", "banner"],
          char: "🇬🇵",
        },
        guam: {
          keywords: ["gu", "flag", "nation", "country", "banner"],
          char: "🇬🇺",
        },
        guatemala: {
          keywords: ["gt", "flag", "nation", "country", "banner"],
          char: "🇬🇹",
        },
        guernsey: {
          keywords: ["gg", "flag", "nation", "country", "banner"],
          char: "🇬🇬",
        },
        guinea: {
          keywords: ["gn", "flag", "nation", "country", "banner"],
          char: "🇬🇳",
        },
        guinea_bissau: {
          keywords: ["gw", "bissau", "flag", "nation", "country", "banner"],
          char: "🇬🇼",
        },
        guyana: {
          keywords: ["gy", "flag", "nation", "country", "banner"],
          char: "🇬🇾",
        },
        haiti: {
          keywords: ["ht", "flag", "nation", "country", "banner"],
          char: "🇭🇹",
        },
        honduras: {
          keywords: ["hn", "flag", "nation", "country", "banner"],
          char: "🇭🇳",
        },
        hong_kong: {
          keywords: ["hong", "kong", "flag", "nation", "country", "banner"],
          char: "🇭🇰",
        },
        hungary: {
          keywords: ["hu", "flag", "nation", "country", "banner"],
          char: "🇭🇺",
        },
        iceland: {
          keywords: ["is", "flag", "nation", "country", "banner"],
          char: "🇮🇸",
        },
        india: {
          keywords: ["in", "flag", "nation", "country", "banner"],
          char: "🇮🇳",
        },
        indonesia: {
          keywords: ["flag", "nation", "country", "banner"],
          char: "🇮🇩",
        },
        iran: {
          keywords: [
            "iran,",
            "islamic",
            "republic",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇮🇷",
        },
        iraq: {
          keywords: ["iq", "flag", "nation", "country", "banner"],
          char: "🇮🇶",
        },
        ireland: {
          keywords: ["ie", "flag", "nation", "country", "banner"],
          char: "🇮🇪",
        },
        isle_of_man: {
          keywords: ["isle", "man", "flag", "nation", "country", "banner"],
          char: "🇮🇲",
        },
        israel: {
          keywords: ["il", "flag", "nation", "country", "banner"],
          char: "🇮🇱",
        },
        it: {
          keywords: ["italy", "flag", "nation", "country", "banner"],
          char: "🇮🇹",
        },
        cote_divoire: {
          keywords: ["ivory", "coast", "flag", "nation", "country", "banner"],
          char: "🇨🇮",
        },
        jamaica: {
          keywords: ["jm", "flag", "nation", "country", "banner"],
          char: "🇯🇲",
        },
        jp: {
          keywords: ["japanese", "nation", "flag", "country", "banner"],
          char: "🇯🇵",
        },
        jersey: {
          keywords: ["je", "flag", "nation", "country", "banner"],
          char: "🇯🇪",
        },
        jordan: {
          keywords: ["jo", "flag", "nation", "country", "banner"],
          char: "🇯🇴",
        },
        kazakhstan: {
          keywords: ["kz", "flag", "nation", "country", "banner"],
          char: "🇰🇿",
        },
        kenya: {
          keywords: ["ke", "flag", "nation", "country", "banner"],
          char: "🇰🇪",
        },
        kiribati: {
          keywords: ["ki", "flag", "nation", "country", "banner"],
          char: "🇰🇮",
        },
        kosovo: {
          keywords: ["xk", "flag", "nation", "country", "banner"],
          char: "🇽🇰",
        },
        kuwait: {
          keywords: ["kw", "flag", "nation", "country", "banner"],
          char: "🇰🇼",
        },
        kyrgyzstan: {
          keywords: ["kg", "flag", "nation", "country", "banner"],
          char: "🇰🇬",
        },
        laos: {
          keywords: [
            "lao",
            "democratic",
            "republic",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇱🇦",
        },
        latvia: {
          keywords: ["lv", "flag", "nation", "country", "banner"],
          char: "🇱🇻",
        },
        lebanon: {
          keywords: ["lb", "flag", "nation", "country", "banner"],
          char: "🇱🇧",
        },
        lesotho: {
          keywords: ["ls", "flag", "nation", "country", "banner"],
          char: "🇱🇸",
        },
        liberia: {
          keywords: ["lr", "flag", "nation", "country", "banner"],
          char: "🇱🇷",
        },
        libya: {
          keywords: ["ly", "flag", "nation", "country", "banner"],
          char: "🇱🇾",
        },
        liechtenstein: {
          keywords: ["li", "flag", "nation", "country", "banner"],
          char: "🇱🇮",
        },
        lithuania: {
          keywords: ["lt", "flag", "nation", "country", "banner"],
          char: "🇱🇹",
        },
        luxembourg: {
          keywords: ["lu", "flag", "nation", "country", "banner"],
          char: "🇱🇺",
        },
        macau: {
          keywords: ["macao", "flag", "nation", "country", "banner"],
          char: "🇲🇴",
        },
        macedonia: {
          keywords: ["macedonia,", "flag", "nation", "country", "banner"],
          char: "🇲🇰",
        },
        madagascar: {
          keywords: ["mg", "flag", "nation", "country", "banner"],
          char: "🇲🇬",
        },
        malawi: {
          keywords: ["mw", "flag", "nation", "country", "banner"],
          char: "🇲🇼",
        },
        malaysia: {
          keywords: ["my", "flag", "nation", "country", "banner"],
          char: "🇲🇾",
        },
        maldives: {
          keywords: ["mv", "flag", "nation", "country", "banner"],
          char: "🇲🇻",
        },
        mali: {
          keywords: ["ml", "flag", "nation", "country", "banner"],
          char: "🇲🇱",
        },
        malta: {
          keywords: ["mt", "flag", "nation", "country", "banner"],
          char: "🇲🇹",
        },
        marshall_islands: {
          keywords: [
            "marshall",
            "islands",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇲🇭",
        },
        martinique: {
          keywords: ["mq", "flag", "nation", "country", "banner"],
          char: "🇲🇶",
        },
        mauritania: {
          keywords: ["mr", "flag", "nation", "country", "banner"],
          char: "🇲🇷",
        },
        mauritius: {
          keywords: ["mu", "flag", "nation", "country", "banner"],
          char: "🇲🇺",
        },
        mayotte: {
          keywords: ["yt", "flag", "nation", "country", "banner"],
          char: "🇾🇹",
        },
        mexico: {
          keywords: ["mx", "flag", "nation", "country", "banner"],
          char: "🇲🇽",
        },
        micronesia: {
          keywords: [
            "micronesia,",
            "federated",
            "states",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇫🇲",
        },
        moldova: {
          keywords: [
            "moldova,",
            "republic",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇲🇩",
        },
        monaco: {
          keywords: ["mc", "flag", "nation", "country", "banner"],
          char: "🇲🇨",
        },
        mongolia: {
          keywords: ["mn", "flag", "nation", "country", "banner"],
          char: "🇲🇳",
        },
        montenegro: {
          keywords: ["me", "flag", "nation", "country", "banner"],
          char: "🇲🇪",
        },
        montserrat: {
          keywords: ["ms", "flag", "nation", "country", "banner"],
          char: "🇲🇸",
        },
        morocco: {
          keywords: ["ma", "flag", "nation", "country", "banner"],
          char: "🇲🇦",
        },
        mozambique: {
          keywords: ["mz", "flag", "nation", "country", "banner"],
          char: "🇲🇿",
        },
        myanmar: {
          keywords: ["mm", "flag", "nation", "country", "banner"],
          char: "🇲🇲",
        },
        namibia: {
          keywords: ["na", "flag", "nation", "country", "banner"],
          char: "🇳🇦",
        },
        nauru: {
          keywords: ["nr", "flag", "nation", "country", "banner"],
          char: "🇳🇷",
        },
        nepal: {
          keywords: ["np", "flag", "nation", "country", "banner"],
          char: "🇳🇵",
        },
        netherlands: {
          keywords: ["nl", "flag", "nation", "country", "banner"],
          char: "🇳🇱",
        },
        new_caledonia: {
          keywords: ["new", "caledonia", "flag", "nation", "country", "banner"],
          char: "🇳🇨",
        },
        new_zealand: {
          keywords: ["new", "zealand", "flag", "nation", "country", "banner"],
          char: "🇳🇿",
        },
        nicaragua: {
          keywords: ["ni", "flag", "nation", "country", "banner"],
          char: "🇳🇮",
        },
        niger: {
          keywords: ["ne", "flag", "nation", "country", "banner"],
          char: "🇳🇪",
        },
        nigeria: {
          keywords: ["flag", "nation", "country", "banner"],
          char: "🇳🇬",
        },
        niue: {
          keywords: ["nu", "flag", "nation", "country", "banner"],
          char: "🇳🇺",
        },
        norfolk_island: {
          keywords: [
            "norfolk",
            "island",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇳🇫",
        },
        northern_mariana_islands: {
          keywords: [
            "northern",
            "mariana",
            "islands",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇲🇵",
        },
        north_korea: {
          keywords: ["north", "korea", "nation", "flag", "country", "banner"],
          char: "🇰🇵",
        },
        norway: {
          keywords: ["no", "flag", "nation", "country", "banner"],
          char: "🇳🇴",
        },
        oman: {
          keywords: ["om_symbol", "flag", "nation", "country", "banner"],
          char: "🇴🇲",
        },
        pakistan: {
          keywords: ["pk", "flag", "nation", "country", "banner"],
          char: "🇵🇰",
        },
        palau: {
          keywords: ["pw", "flag", "nation", "country", "banner"],
          char: "🇵🇼",
        },
        palestinian_territories: {
          keywords: [
            "palestine",
            "palestinian",
            "territories",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇵🇸",
        },
        panama: {
          keywords: ["pa", "flag", "nation", "country", "banner"],
          char: "🇵🇦",
        },
        papua_new_guinea: {
          keywords: [
            "papua",
            "new",
            "guinea",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇵🇬",
        },
        paraguay: {
          keywords: ["py", "flag", "nation", "country", "banner"],
          char: "🇵🇾",
        },
        peru: {
          keywords: ["pe", "flag", "nation", "country", "banner"],
          char: "🇵🇪",
        },
        philippines: {
          keywords: ["ph", "flag", "nation", "country", "banner"],
          char: "🇵🇭",
        },
        pitcairn_islands: {
          keywords: ["pitcairn", "flag", "nation", "country", "banner"],
          char: "🇵🇳",
        },
        poland: {
          keywords: ["pl", "flag", "nation", "country", "banner"],
          char: "🇵🇱",
        },
        portugal: {
          keywords: ["pt", "flag", "nation", "country", "banner"],
          char: "🇵🇹",
        },
        puerto_rico: {
          keywords: ["puerto", "rico", "flag", "nation", "country", "banner"],
          char: "🇵🇷",
        },
        qatar: {
          keywords: ["qa", "flag", "nation", "country", "banner"],
          char: "🇶🇦",
        },
        reunion: {
          keywords: ["réunion", "flag", "nation", "country", "banner"],
          char: "🇷🇪",
        },
        romania: {
          keywords: ["ro", "flag", "nation", "country", "banner"],
          char: "🇷🇴",
        },
        ru: {
          keywords: [
            "russian",
            "federation",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇷🇺",
        },
        rwanda: {
          keywords: ["rw", "flag", "nation", "country", "banner"],
          char: "🇷🇼",
        },
        st_barthelemy: {
          keywords: [
            "saint",
            "barthélemy",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇧🇱",
        },
        st_helena: {
          keywords: [
            "saint",
            "helena",
            "ascension",
            "tristan",
            "cunha",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇸🇭",
        },
        st_kitts_nevis: {
          keywords: [
            "saint",
            "kitts",
            "nevis",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇰🇳",
        },
        st_lucia: {
          keywords: ["saint", "lucia", "flag", "nation", "country", "banner"],
          char: "🇱🇨",
        },
        st_pierre_miquelon: {
          keywords: [
            "saint",
            "pierre",
            "miquelon",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇵🇲",
        },
        st_vincent_grenadines: {
          keywords: [
            "saint",
            "vincent",
            "grenadines",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇻🇨",
        },
        samoa: {
          keywords: ["ws", "flag", "nation", "country", "banner"],
          char: "🇼🇸",
        },
        san_marino: {
          keywords: ["san", "marino", "flag", "nation", "country", "banner"],
          char: "🇸🇲",
        },
        sao_tome_principe: {
          keywords: [
            "sao",
            "tome",
            "principe",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇸🇹",
        },
        saudi_arabia: {
          keywords: ["flag", "nation", "country", "banner"],
          char: "🇸🇦",
        },
        senegal: {
          keywords: ["sn", "flag", "nation", "country", "banner"],
          char: "🇸🇳",
        },
        serbia: {
          keywords: ["rs", "flag", "nation", "country", "banner"],
          char: "🇷🇸",
        },
        seychelles: {
          keywords: ["sc", "flag", "nation", "country", "banner"],
          char: "🇸🇨",
        },
        sierra_leone: {
          keywords: ["sierra", "leone", "flag", "nation", "country", "banner"],
          char: "🇸🇱",
        },
        singapore: {
          keywords: ["sg", "flag", "nation", "country", "banner"],
          char: "🇸🇬",
        },
        sint_maarten: {
          keywords: [
            "sint",
            "maarten",
            "dutch",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇸🇽",
        },
        slovakia: {
          keywords: ["sk", "flag", "nation", "country", "banner"],
          char: "🇸🇰",
        },
        slovenia: {
          keywords: ["si", "flag", "nation", "country", "banner"],
          char: "🇸🇮",
        },
        solomon_islands: {
          keywords: [
            "solomon",
            "islands",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇸🇧",
        },
        somalia: {
          keywords: ["so", "flag", "nation", "country", "banner"],
          char: "🇸🇴",
        },
        south_africa: {
          keywords: ["south", "africa", "flag", "nation", "country", "banner"],
          char: "🇿🇦",
        },
        south_georgia_south_sandwich_islands: {
          keywords: [
            "south",
            "georgia",
            "sandwich",
            "islands",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇬🇸",
        },
        kr: {
          keywords: ["south", "korea", "nation", "flag", "country", "banner"],
          char: "🇰🇷",
        },
        south_sudan: {
          keywords: ["south", "sd", "flag", "nation", "country", "banner"],
          char: "🇸🇸",
        },
        es: {
          keywords: ["spain", "flag", "nation", "country", "banner"],
          char: "🇪🇸",
        },
        sri_lanka: {
          keywords: ["sri", "lanka", "flag", "nation", "country", "banner"],
          char: "🇱🇰",
        },
        sudan: {
          keywords: ["sd", "flag", "nation", "country", "banner"],
          char: "🇸🇩",
        },
        suriname: {
          keywords: ["sr", "flag", "nation", "country", "banner"],
          char: "🇸🇷",
        },
        swaziland: {
          keywords: ["sz", "flag", "nation", "country", "banner"],
          char: "🇸🇿",
        },
        sweden: {
          keywords: ["se", "flag", "nation", "country", "banner"],
          char: "🇸🇪",
        },
        switzerland: {
          keywords: ["ch", "flag", "nation", "country", "banner"],
          char: "🇨🇭",
        },
        syria: {
          keywords: [
            "syrian",
            "arab",
            "republic",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇸🇾",
        },
        taiwan: {
          keywords: ["tw", "flag", "nation", "country", "banner"],
          char: "🇹🇼",
        },
        tajikistan: {
          keywords: ["tj", "flag", "nation", "country", "banner"],
          char: "🇹🇯",
        },
        tanzania: {
          keywords: [
            "tanzania,",
            "united",
            "republic",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇹🇿",
        },
        thailand: {
          keywords: ["th", "flag", "nation", "country", "banner"],
          char: "🇹🇭",
        },
        timor_leste: {
          keywords: ["timor", "leste", "flag", "nation", "country", "banner"],
          char: "🇹🇱",
        },
        togo: {
          keywords: ["tg", "flag", "nation", "country", "banner"],
          char: "🇹🇬",
        },
        tokelau: {
          keywords: ["tk", "flag", "nation", "country", "banner"],
          char: "🇹🇰",
        },
        tonga: {
          keywords: ["to", "flag", "nation", "country", "banner"],
          char: "🇹🇴",
        },
        trinidad_tobago: {
          keywords: [
            "trinidad",
            "tobago",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇹🇹",
        },
        tunisia: {
          keywords: ["tn", "flag", "nation", "country", "banner"],
          char: "🇹🇳",
        },
        tr: {
          keywords: ["turkey", "flag", "nation", "country", "banner"],
          char: "🇹🇷",
        },
        turkmenistan: {
          keywords: ["flag", "nation", "country", "banner"],
          char: "🇹🇲",
        },
        turks_caicos_islands: {
          keywords: [
            "turks",
            "caicos",
            "islands",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇹🇨",
        },
        tuvalu: {
          keywords: ["flag", "nation", "country", "banner"],
          char: "🇹🇻",
        },
        uganda: {
          keywords: ["ug", "flag", "nation", "country", "banner"],
          char: "🇺🇬",
        },
        ukraine: {
          keywords: ["ua", "flag", "nation", "country", "banner"],
          char: "🇺🇦",
        },
        united_arab_emirates: {
          keywords: [
            "united",
            "arab",
            "emirates",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇦🇪",
        },
        uk: {
          keywords: [
            "united",
            "kingdom",
            "great",
            "britain",
            "northern",
            "ireland",
            "flag",
            "nation",
            "country",
            "banner",
            "british",
            "UK",
            "english",
            "england",
            "union jack",
          ],
          char: "🇬🇧",
        },
        england: {
          keywords: ["flag", "english"],
          char: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
        },
        scotland: {
          keywords: ["flag", "scottish"],
          char: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
        },
        wales: {
          keywords: ["flag", "welsh"],
          char: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
        },
        us: {
          keywords: [
            "united",
            "states",
            "america",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇺🇸",
        },
        us_virgin_islands: {
          keywords: [
            "virgin",
            "islands",
            "us",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇻🇮",
        },
        uruguay: {
          keywords: ["uy", "flag", "nation", "country", "banner"],
          char: "🇺🇾",
        },
        uzbekistan: {
          keywords: ["uz", "flag", "nation", "country", "banner"],
          char: "🇺🇿",
        },
        vanuatu: {
          keywords: ["vu", "flag", "nation", "country", "banner"],
          char: "🇻🇺",
        },
        vatican_city: {
          keywords: ["vatican", "city", "flag", "nation", "country", "banner"],
          char: "🇻🇦",
        },
        venezuela: {
          keywords: [
            "ve",
            "bolivarian",
            "republic",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇻🇪",
        },
        vietnam: {
          keywords: ["viet", "nam", "flag", "nation", "country", "banner"],
          char: "🇻🇳",
        },
        wallis_futuna: {
          keywords: ["wallis", "futuna", "flag", "nation", "country", "banner"],
          char: "🇼🇫",
        },
        western_sahara: {
          keywords: [
            "western",
            "sahara",
            "flag",
            "nation",
            "country",
            "banner",
          ],
          char: "🇪🇭",
        },
        yemen: {
          keywords: ["ye", "flag", "nation", "country", "banner"],
          char: "🇾🇪",
        },
        zambia: {
          keywords: ["zm", "flag", "nation", "country", "banner"],
          char: "🇿🇲",
        },
        zimbabwe: {
          keywords: ["zw", "flag", "nation", "country", "banner"],
          char: "🇿🇼",
        },
        united_nations: {
          keywords: ["un", "flag", "banner"],
          char: "🇺🇳",
        },
        pirate_flag: {
          keywords: ["skull", "crossbones", "flag", "banner"],
          char: "🏴‍☠️",
        },
      },
    },
  },
];
