import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";

const DepartmentStudents = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStudents = async () => {
    try {
      const res = await api.get("/hod/students");
      setStudents(res.data.data || []);
    } catch (err) {
      console.error("Load students error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const renderItem = ({ item }) => {
    const p = item.personalInfo || {};
    const a = item.academicInfo || {};

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("StudentDetail", {
            studentId: item._id,
          })
        }
      >
        <Text style={styles.name}>
          {p.firstName || ""} {p.lastName || ""}
        </Text>

        <Text style={styles.sub}>Roll: {a.rollNumber || "—"}</Text>

        <Text style={styles.sub}>
          Class: {a.class || "—"} {a.section || ""}
        </Text>

        <Text style={styles.sub}>UserID: {item.userId}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={students}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadStudents();
          }}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    margin: 12,
    padding: 16,
    borderRadius: 14,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: COLORS.slate,
    marginTop: 2,
  },
});

export default DepartmentStudents;
