import { Colors } from "@/constants/Colors";
import { Dialect, dialectConfig } from "@/constants/i18n";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface LanguageDialectPickerProps {
  visible: boolean;
  onClose: () => void;
  currentDialect: Dialect;
  onSelectDialect: (dialect: Dialect) => void;
}

export const LanguageDialectPicker: React.FC<LanguageDialectPickerProps> = ({
  visible,
  onClose,
  currentDialect,
  onSelectDialect,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";

  const dialectKeys: Dialect[] = Object.keys(dialectConfig) as Dialect[];

  const handleSelectDialect = (dialect: Dialect) => {
    onSelectDialect(dialect);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View
          style={[
            styles.modalView,
            {
              backgroundColor: colors.background,
              borderColor: colors.tint,
            },
          ]}
        >
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              选择方言
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeBtn, { color: colors.tint }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
          >
            {dialectKeys.map((dialect) => (
              <TouchableOpacity
                key={dialect}
                style={[
                  styles.dialectItem,
                  {
                    backgroundColor: isDark ? "#333" : "#f5f5f5",
                    borderBottomColor: isDark ? "#444" : "#e0e0e0",
                  },
                  currentDialect === dialect && {
                    backgroundColor: colors.tint,
                  },
                ]}
                onPress={() => handleSelectDialect(dialect)}
              >
                <View style={styles.dialectContent}>
                  <Text
                    style={[
                      styles.dialectLabel,
                      {
                        color:
                          currentDialect === dialect
                            ? isDark
                              ? "#fff"
                              : "#fff"
                            : colors.text,
                      },
                    ]}
                  >
                    {dialectConfig[dialect].label}
                  </Text>
                  <Text
                    style={[
                      styles.dialectVoice,
                      {
                        color:
                          currentDialect === dialect
                            ? isDark
                              ? "#f0f0f0"
                              : "#f0f0f0"
                            : colors.icon,
                      },
                    ]}
                  >
                    {dialectConfig[dialect].voiceName}
                  </Text>
                </View>
                {currentDialect === dialect && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalView: {
    width: "100%",
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeBtn: {
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  dialectItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  dialectContent: {
    flex: 1,
  },
  dialectLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  dialectVoice: {
    fontSize: 12,
  },
  checkmark: {
    fontSize: 20,
    color: "#fff",
    marginLeft: 10,
  },
});
