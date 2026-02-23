// screens/HOD/DepartmentTeachers.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
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

/* ----------------------------- CARD ----------------------------- */

const TeacherCard = ({ teacher, onPress }) => {
  const personalInfo = teacher.personalInfo || {};
  const teachingInfo = teacher.teachingInfo || {};
  const department = teacher.departmentId || {};

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(teacher)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {personalInfo.firstName?.[0] || ""}
          {personalInfo.lastName?.[0] || ""}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>
          {personalInfo.firstName || ""} {personalInfo.lastName || ""}
        </Text>
        <Text style={styles.details}>
          {teachingInfo.subjects?.join(", ") || "No subjects"}
        </Text>
        <View style={styles.idContainer}>
          <Text style={styles.id}>{teacher.userId}</Text>
        </View>
        {teachingInfo.isClassTeacher && (
          <View style={styles.badgeContainer}>
            <Ionicons name="star" size={12} color="#d72c2c" />
            <Text style={styles.badgeText}>Class Teacher</Text>
          </View>
        )}
        {department.name && (
          <Text style={styles.department}>{department.name}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );
};

/* ----------------------------- MAIN ----------------------------- */

const DepartmentTeachers = ({ navigation }) => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    filterTeachers();
  }, [searchQuery, teachers]);

  /* ----------------------------- LOAD ----------------------------- */

  const loadTeachers = async () => {
    try {
      const response = await api.get("/hod/teachers");
      console.log("Teachers API response:", response.data);
      
      // Accept multiple backend shapes safely
      const list = response?.data?.data || response?.data || [];
      const teachersList = Array.isArray(list) ? list : [];
      
      // Sort teachers by name alphabetically
      const sortedTeachers = teachersList.sort((a, b) => {
        const nameA = `${a.personalInfo?.firstName || ""} ${a.personalInfo?.lastName || ""}`.toLowerCase();
        const nameB = `${b.personalInfo?.firstName || ""} ${b.personalInfo?.lastName || ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setTeachers(sortedTeachers);
    } catch (error) {
      console.error("Load teachers error:", error);
      Alert.alert("Error", "Failed to load teachers");
      setTeachers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ----------------------------- FILTER ----------------------------- */

  const filterTeachers = () => {
    if (!searchQuery) {
      setFilteredTeachers(teachers || []);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = (teachers || []).filter((t) => {
      const personalInfo = t.personalInfo || {};
      return (
        t?.userId?.toLowerCase?.().includes(query) ||
        personalInfo?.firstName?.toLowerCase?.().includes(query) ||
        personalInfo?.lastName?.toLowerCase?.().includes(query) ||
        personalInfo?.email?.toLowerCase?.().includes(query)
      );
    });

    // Keep filtered teachers sorted
    const sortedFiltered = filtered.sort((a, b) => {
      const nameA = `${a.personalInfo?.firstName || ""} ${a.personalInfo?.lastName || ""}`.toLowerCase();
      const nameB = `${b.personalInfo?.firstName || ""} ${b.personalInfo?.lastName || ""}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    setFilteredTeachers(sortedFiltered);
  };

  /* ----------------------------- HANDLERS ----------------------------- */

  const onRefresh = () => {
    setRefreshing(true);
    loadTeachers();
  };

  const handleTeacherPress = (teacher) => {
    // Navigate to teacher details or show options
      navigation.navigate("HODTeacherDetail", { teacherId: teacher._id });
    // Alert.alert(
    //   "Teacher Details",
    //   `${teacher.personalInfo?.firstName} ${teacher.personalInfo?.lastName}`,
    //   [
    //     { text: "OK" },
    //     { 
    //       text: "View Details", 
    //       onPress: () => {
    //         // Navigate to teacher detail screen if available
    //         // navigation.navigate("TeacherDetail", { teacherId: teacher._id });
    //       } 
    //     }
    //   ]
    // );
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  /* ----------------------------- UI ----------------------------- */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#d72c2c" />
      
      {/* Fixed Header with Back Button */}
      <View style={[styles.header, { backgroundColor: "#d72c2c" }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Department Teachers</Text>
            <Text style={styles.subtitle}>
              {teachers?.length || 0} teacher{teachers?.length !== 1 ? 's' : ''}
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
          placeholder="Search by name, ID, or email..."
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
              colors={["#d72c2c"]}
              tintColor="#d72c2c"
            />
          }
        >
          {/* Spacer for fixed header and search bar */}
          <View style={{ height: HEADER_HEIGHT + 70 }} />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#d72c2c" />
              <Text style={styles.loadingText}>Loading teachers...</Text>
            </View>
          ) : filteredTeachers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No teachers found</Text>
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Text style={styles.clearSearchText}>Clear search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredTeachers.map((item) => (
              <TeacherCard 
                key={item._id} 
                teacher={item} 
                onPress={handleTeacherPress} 
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

/* ----------------------------- STYLES ----------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4e7e7",
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
    shadowColor: "#ffff00",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
  // Card styles - matching Department Students
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
    color: "#d72c2c",
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
  idContainer: {
    alignSelf: "flex-start",
    marginTop: 2,
  },
  id: {
    fontSize: 12,
    color: "#444546",
    backgroundColor: "#1c46ff2c",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d7262649",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    color: "#d72c2c",
    fontWeight: "600",
  },
  department: {
    fontSize: 11,
    color: "#d72c2c",
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
    color: "#d72c2c",
    fontWeight: "600",
  },
});

export default DepartmentTeachers;