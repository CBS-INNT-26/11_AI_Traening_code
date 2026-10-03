// screens/HomeScreen.js
import { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import chatFaceData from "../services/ChatFaceData"; // bemærk lille c da det er data vi importerer
import GlobalStyles from "../styles/GlobalStyles";

export default function HomeScreen({ navigation }) {
  // brug andre navne end importen
  const [faces] = useState(chatFaceData); // statisk liste
  const [selectedFace, setSelectedFace] = useState(faces[0]); // default valgt bot

  useEffect(() => {
    (async () => {
      try {
        // vi gemmer og læser et 0-baseret index (samme som i ChatScreen)
        const idxStr = await AsyncStorage.getItem("chatFaceId");
        const idx = Number.parseInt(idxStr ?? "0", 10);
        const chosen = faces[idx] ?? faces[0];
        setSelectedFace(chosen);
      } catch (e) {
        setSelectedFace(faces[0]);
      }
    })();
  }, [faces]);

  // vælg bot og gem index
  const onChatFacePress = async (id) => {
    const idx = faces.findIndex((f) => f.id === id);
    if (idx >= 0) {
      setSelectedFace(faces[idx]);
      await AsyncStorage.setItem("chatFaceId", String(idx));
    }
  };

  return (
    <View style={GlobalStyles.homeContainer}>
      <View style={GlobalStyles.homeCenter}>
        <Text
          style={[GlobalStyles.homeHello, { color: selectedFace?.primary }]}
        >
          Hello,
        </Text>

        <Text style={[GlobalStyles.homeName, { color: selectedFace?.primary }]}>
          I am {selectedFace?.name}
        </Text>

        <Image
          source={selectedFace?.image ? { uri: selectedFace.image } : undefined}
          style={GlobalStyles.homeImage}
        />

        <Text style={GlobalStyles.homeHelp}>How Can I help you?</Text>

        <View style={GlobalStyles.homeBotList}>
          <FlatList
            data={faces}
            keyExtractor={(item) => String(item.id)}
            horizontal
            renderItem={({ item }) =>
              item.id !== selectedFace?.id && (
                <TouchableOpacity
                  style={{ margin: 15 }}
                  onPress={() => onChatFacePress(item.id)}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={GlobalStyles.homeBotAvatar}
                  />
                </TouchableOpacity>
              )
            }
          />
          <Text style={GlobalStyles.homeBotListText}>
            Choose Your Fav ChatBuddy
          </Text>
        </View>

        <TouchableOpacity
          style={[
            GlobalStyles.homeChatButton,
            { backgroundColor: selectedFace?.primary },
          ]}
          onPress={() => navigation.navigate("chat")}
        >
          <Text style={GlobalStyles.homeChatButtonText}>Let's Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
