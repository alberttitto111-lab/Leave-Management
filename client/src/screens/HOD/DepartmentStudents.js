// screens/HOD/DepartmentStudents.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StatusBar,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";

const HEADER_HEIGHT = 120;

const StudentCard = ({ student, onPress }) => {
  const p = student.personalInfo || {};
  const a = student.academicInfo || {};
  const department = student.departmentId || {};

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(student)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {p.firstName?.[0] || ""}
          {p.lastName?.[0] || ""}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>
          {p.firstName || ""} {p.lastName || ""}
        </Text>
        <Text style={styles.details}>
          {a.class || ""}{a.section ? `-${a.section}` : ""} • Roll: {a.rollNumber || "N/A"}
        </Text>
        <Text style={styles.id}>{student.userId}</Text>
        {department.name && (
          <Text style={styles.department}>{department.name}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );
};

const DepartmentStudents = ({ navigation }) => {
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

  const loadStudents = async () => {
    try {
      const response = await api.get("/hod/students");
      console.log("Students API response:", response.data);
      
      // Accept multiple backend shapes safely
      const list = response?.data?.data || response?.data || [];
      setStudents(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Load students error:", error);
      Alert.alert("Error", "Failed to load students");
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterStudents = () => {
    if (!searchQuery) {
      setFilteredStudents(students || []);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = (students || []).filter((s) => {
      const personalInfo = s.personalInfo || {};
      const academicInfo = s.academicInfo || {};
      return (
        s?.userId?.toLowerCase?.().includes(query) ||
        personalInfo?.firstName?.toLowerCase?.().includes(query) ||
        personalInfo?.lastName?.toLowerCase?.().includes(query) ||
        academicInfo?.rollNumber?.toString?.().includes(query) ||
        academicInfo?.class?.toLowerCase?.().includes(query)
      );
    });

    setFilteredStudents(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  const handleStudentPress = (student) => {
    // Navigate to student details
    navigation.navigate("StudentDetail", { studentId: student._id });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.hod || "#6366F1"} />
      
      {/* Fixed Header with Back Button */}
      <View style={[styles.header, { backgroundColor: "#d72c2c"  }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Department Students</Text>
            <Text style={styles.subtitle}>
              {students?.length || 0} student{students?.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Search Bar - Fixed below header */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID, or roll number..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Scroll Area with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? HEADER_HEIGHT + 70 : 0}
      >
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          indicatorStyle="black"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[COLORS.hod || "#6366F1"]}
              tintColor={COLORS.hod || "#6366F1"}
            />
          }
        >
          {/* Spacer for fixed header and search bar */}
          <View style={{ height: HEADER_HEIGHT + 70 }} />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.hod || "#6366F1"} />
              <Text style={styles.loadingText}>Loading students...</Text>
            </View>
          ) : filteredStudents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No students found</Text>
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Text style={styles.clearSearchText}>Clear search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredStudents.map((item) => (
              <StudentCard 
                key={item._id} 
                student={item} 
                onPress={handleStudentPress} 
              />
            ))
          )}

          {/* Bottom padding for comfortable scrolling */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0e4e4",
  },
  // Fixed Header styles
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    zIndex: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  // Search Bar - Fixed below header
  searchContainer: {
    position: "absolute",
    top: HEADER_HEIGHT + 10,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
    zIndex: 11,
    height: 50,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#1E293B",
  },
  // Scroll content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  // Loading state
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748B",
  },
  // Card styles
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
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
    color: COLORS.hod || "#6366F1",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  details: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  id: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  department: {
    fontSize: 11,
    color: COLORS.hod || "#6366F1",
    marginTop: 2,
    fontWeight: "500",
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#94A3B8",
  },
  clearSearchText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.hod || "#6366F1",
    fontWeight: "600",
  },
});

export default DepartmentStudents;