//screens/ChatScreen.js
import { useRef } from "react";
import { useState, useEffect, useCallback } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Bubble, GiftedChat, InputToolbar, Send} from "react-native-gifted-chat";

import { FontAwesome } from "@expo/vector-icons";
import GlobalStyles from "../styles/GlobalStyles";

import chatFaceData from "../services/ChatFaceData";
import SendMessage from "../services/Request";
import SYSTEM_PROMPT from "../services/SystemPrompt";
import { runGuardrails } from "../services/Guardrails";

let CHAT_BOT_FACE =
  "https://res.cloudinary.com/dknvsbuyy/image/upload/v1685678135/chat_1_c7eda483e3.png";

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatFaceColor, setChatFaceColor] = useState();

  //Definere vores chat "hukommelse". System-prompten (vores "træning" af
  //AI'en) ligger i services/SystemPrompt.js.
  const conversationHistory = useRef([
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "assistant",
      content: "Hello, I am your assistant. How can I help you?",
    },
  ]);

  //Håndtere valgt ChatBot
  useEffect(() => {
    checkFaceId();
  }, []);

  //Sætter den valgte chatbot til og sender den første besked
  const checkFaceId = async () => {
    const idStr = await AsyncStorage.getItem("chatFaceId");
    const idx = Number.parseInt(idStr ?? "0", 10);
    const face = chatFaceData[idx] ?? chatFaceData[0];
    CHAT_BOT_FACE = face.image;
    setChatFaceColor(face.primary);
    setMessages([
      {
        _id: 1,
        text: "Hello, I am " + face.name + ", How Can I help you?",
        createdAt: Date.now(),
        user: {
          _id: 2,
          name: "React Native",
          avatar: CHAT_BOT_FACE,
        },
      },
    ]);
  };

  //Håndtere Chatten
  const onSend = useCallback((messages = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, messages)
    );
    if (messages[0].text) {
      handleIncomingMessage(messages[0].text);
    }
  }, []);

  //Viser en bot-besked i chatten, uden at gemme den i AI'ens "hukommelse".
  //Bruges både til rigtige AI-svar og til guardrail-afvisninger.
  const respondWithBotMessage = (text) => {
    const chatAIResp = {
      _id: Math.random() * (9999999 - 1),
      text,
      createdAt: Date.now(),
      user: {
        _id: 2,
        name: "React Native",
        avatar: CHAT_BOT_FACE,
      },
    };
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, chatAIResp)
    );
  };

  //Kører guardrails på beskeden, før den sendes videre til tutor-modellen.
  //Bliver beskeden stoppet, svarer vi med forklaringen fra guardrailen i
  //stedet for at bruge et (dyrere) kald til selve chat-modellen.
  const handleIncomingMessage = async (msg) => {
    setLoading(true);
    const guardrailResult = await runGuardrails(msg);
    if (!guardrailResult.allowed) {
      setLoading(false);
      respondWithBotMessage(guardrailResult.reason);
      return;
    }
    getBardResp(msg);
  };

  //Håndtere API Kald og BOT Svar
  const getBardResp = (msg) => {
    //Sætter brugerens besked i vores chat "hukommelse"
    const userMessage = { role: "user", content: msg };
    conversationHistory.current.push(userMessage);

    //SendMessage er vores funktion fra RequestPage.js
    SendMessage(conversationHistory.current)
      .then((response) => {
        setLoading(false);

        const text = response.content || "Sorry, I cannot help with it";
        if (response.content) {
          //Sætter chat AI's svar i vores chat "hukommelse"
          conversationHistory.current.push({ role: "assistant", content: text });
        }

        respondWithBotMessage(text);
      })
      .catch((error) => {
        setLoading(false);
        console.error(error);
        // Handle error further if needed
      });
  };

  //Custom Bubble
  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: GlobalStyles.bubbleRight,
        }}
        textStyle={{
          right: GlobalStyles.bubbleRightText,
          left: GlobalStyles.bubbleLeftText,
        }}
      />
    );
  };

  const renderInputToolbar = (props) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={GlobalStyles.inputToolbarContainer}
        textInputStyle={GlobalStyles.inputToolbarText}
        textInputProps={{
          ...props.textInputProps,
          editable: true,
          placeholder: "Type a message...",
          placeholderTextColor: "#eee",
        }}
      />
    );
  };

  const renderSend = (props) => {
    return (
      <Send {...props}>
        <View style={GlobalStyles.sendButton}>
          <FontAwesome
            name="send"
            size={24}
            color="white"
            resizeMode={"center"}
          />
        </View>
      </Send>
    );
  };

  //SafeAreaView er en container, der beskytter mod systembarer, keyboard og andre elementer, der kan dække ind - Specielt vigtig i de nye IOS versioner
  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
      <View style={GlobalStyles.mainView}>
        <GiftedChat
          messages={messages}
          isTyping={loading}
          multiline={true}
          onSend={(messages) => onSend(messages)}
          user={{
            _id: 1,
          }}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderSend={renderSend}
        />
      </View>
    </SafeAreaView>
  );
}
