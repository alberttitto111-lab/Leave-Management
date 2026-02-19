import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";

/* ----------------------------- CARD ----------------------------- */

const StudentCard = ({ student, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={() => onPress(student)}>
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {student?.personalInfo?.firstName?.[0] || ""}
        {student?.personalInfo?.lastName?.[0] || ""}
      </Text>
    </View>
    <View style={styles.info}>
      <Text style={styles.name}>
        {student?.personalInfo?.firstName} {student?.personalInfo?.lastName}
      </Text>
      <Text style={styles.details}>
        {student?.academicInfo?.class}-{student?.academicInfo?.section} • Roll:{" "}
        {student?.academicInfo?.rollNumber}
      </Text>
      <Text style={styles.id}>{student?.userId}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
  </TouchableOpacity>
);

/* ----------------------------- MAIN ----------------------------- */

const StudentList = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, students]);

  /* ----------------------------- LOAD ----------------------------- */

  const loadStudents = async () => {
    try {
      const response = await api.get("/teacher/students");
      console.log("Students API response:", response.data);

      // Accept multiple backend shapes safely
      const list =
        response?.data?.data ||
        response?.data?.students ||
        response?.data ||
        [];

      setStudents(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Load students error:", error);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ----------------------------- FILTER ----------------------------- */

  const filterStudents = () => {
    if (!searchQuery) {
      setFilteredStudents(students || []);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = (students || []).filter((s) => {
      return (
        s?.userId?.toLowerCase?.().includes(query) ||
        s?.personalInfo?.firstName?.toLowerCase?.().includes(query) ||
        s?.personalInfo?.lastName?.toLowerCase?.().includes(query) ||
        s?.academicInfo?.rollNumber?.toString?.().includes(query)
      );
    });

    setFilteredStudents(filtered);
  };

  /* ----------------------------- HANDLERS ----------------------------- */

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  const handleStudentPress = (student) => {
    navigation.navigate("StudentDetail", { studentId: student._id });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  /* ----------------------------- UI ----------------------------- */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D9488" />
      
      {/* Header with Back Button */}
      <View style={[styles.header, { backgroundColor: "#0D9488" }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>My Students</Text>
            <Text style={styles.subtitle}>
              {students?.length || 0} students assigned
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID, or roll number..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredStudents || []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <StudentCard student={item} onPress={handleStudentPress} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          )
        }
      />
    </View>
  );
};

/* ----------------------------- STYLES ----------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#daefe552",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fcfcfc",
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#1E293B",
  },
  listContent: {
    padding: 15,
    paddingTop: 5,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a5ac7",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  details: {
    fontSize: 13,
    color: "#112746",
    marginTop: 2,
  },
  id: {
    fontSize: 12,
    color: "#444546",
    backgroundColor: "#6dff9b3d",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: 10,
    color: "#94A3B8",
  },
});

export default StudentList;