import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";

const DepartmentTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTeachers = async () => {
    const res = await api.get("/hod/teachers");
    setTeachers(res.data.data || []);
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  return (
    <FlatList
      data={teachers}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadTeachers} />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>
            {item.personalInfo?.firstName} {item.personalInfo?.lastName}
          </Text>
          <Text>{item.email}</Text>
          <Text>Dept: {item.teachingInfo?.department}</Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default DepartmentTeachers;
