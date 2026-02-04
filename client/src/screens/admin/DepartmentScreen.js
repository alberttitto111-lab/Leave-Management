import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";

const DepartmentsScreen = ({ navigation }) => {
  const [departments, setDepartments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/admin/departments");
      setDepartments(res.data);
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDepartments();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("AddEditDepartment", { department: item })
      }
    >
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.code}>Code: {item.code}</Text>
      </View>
      <Icon name="pencil" size={22} color={COLORS.info} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={departments}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No departments found</Text>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddEditDepartment")}
      >
        <Icon name="plus" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: "700", color: COLORS.slateDark },
  code: { fontSize: 13, color: COLORS.slate, marginTop: 4 },
  empty: { textAlign: "center", marginTop: 40, color: COLORS.slate },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: COLORS.info,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
});

export default DepartmentsScreen;
