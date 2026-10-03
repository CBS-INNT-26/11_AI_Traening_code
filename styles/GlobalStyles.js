import { StyleSheet } from "react-native";

const GlobalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#671ddf",
  },
  mainView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  bubbleRight: {
    backgroundColor: "#671ddf",
  },
  bubbleLeftText: {
    color: "#671ddf",
    padding: 2,
  },
  bubbleRightText: {
    padding: 2,
  },
  inputToolbarContainer: {
    padding: 3,
    backgroundColor: "#671ddf",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    minHeight: 48,
  },
  inputToolbarText: {
    color: "#fff",
  },
  sendButton: {
    marginRight: 10,
    marginBottom: 5,
  },
  // HomeScreen styles
  homeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  homeCenter: {
    alignItems: "center",
  },
  homeHello: {
    fontSize: 30,
  },
  homeName: {
    fontSize: 30,
    fontWeight: "bold",
  },
  homeImage: {
    height: 150,
    width: 150,
    marginTop: 20,
  },
  homeHelp: {
    marginTop: 30,
    fontSize: 25,
  },
  homeBotList: {
    marginTop: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    height: 110,
    padding: 10,
    borderRadius: 10,
  },
  homeBotAvatar: {
    width: 40,
    height: 40,
  },
  homeBotListText: {
    marginTop: 5,
    fontSize: 17,
    color: "#B0B0B0",
  },
  homeChatButton: {
    marginTop: 40,
    padding: 17,
    width: "60%",
    borderRadius: 100,
    alignItems: "center",
  },
  homeChatButtonText: {
    fontSize: 16,
    color: "#fff",
  },
});

export default GlobalStyles;
