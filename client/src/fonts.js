import * as Font from 'expo-font';

export const loadFonts = async () => {
  await Font.loadAsync({
    'MaterialIcons': require('react-native-vector-icons/Fonts/MaterialIcons.ttf'),
    'MaterialCommunityIcons': require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
    'Ionicons': require('react-native-vector-icons/Fonts/Ionicons.ttf'),
  });
};