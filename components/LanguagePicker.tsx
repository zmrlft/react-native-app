import { Colors } from "@/constants/Colors";
import { Language, getLanguageName } from "@/constants/i18n";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface LanguagePickerProps {
  visible: boolean;
  currentLanguage: Language;
  onLanguageSelect: (language: Language) => void;
  onClose: () => void;
}

export default function LanguagePicker({
  visible,
  currentLanguage,
  onLanguageSelect,
  onClose,
}: LanguagePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const languages: Language[] = ["zh", "en"];

  const handleSelectLanguage = (language: Language) => {
    onLanguageSelect(language);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {currentLanguage === "en" ? "Select Language" : "选择语言"}
          </Text>

          <View style={styles.languageList}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  currentLanguage === lang && [
                    styles.selectedOption,
                    { backgroundColor: colors.tint + "20" },
                  ],
                  { borderBottomColor: colors.tabIconDefault },
                ]}
                onPress={() => handleSelectLanguage(lang)}
              >
                <Text
                  style={[
                    styles.languageText,
                    {
                      color:
                        currentLanguage === lang ? colors.tint : colors.text,
                    },
                  ]}
                >
                  {getLanguageName(lang)}
                </Text>
                {currentLanguage === lang && (
                  <Text style={[styles.checkmark, { color: colors.tint }]}>
                    ✓
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.tint }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>
              {currentLanguage === "en" ? "Close" : "关闭"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    borderRadius: 12,
    padding: 20,
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  languageList: {
    marginBottom: 16,
  },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  selectedOption: {
    borderRadius: 8,
    marginBottom: 4,
  },
  languageText: {
    fontSize: 16,
    fontWeight: "500",
  },
  checkmark: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
