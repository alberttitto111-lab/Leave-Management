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

const HEADER_HEIGHT = 100;

const TeacherCard = ({ teacher, onPress }) => {
  const personalInfo = teacher.personalInfo || {};
  const teachingInfo = teacher.teachingInfo || {};

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
          {teachingInfo.isClassTeacher && " • Class Teacher"}
        </Text>
        <Text style={styles.id}>{teacher.userId}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );
};

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

  const loadTeachers = async () => {
    try {
      const response = await api.get("/hod/teachers");
      console.log("Teachers API response:", response.data);
      
      // Accept multiple backend shapes safely
      const list = response?.data?.data || response?.data || [];
      setTeachers(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Load teachers error:", error);
      Alert.alert("Error", "Failed to load teachers");
      setTeachers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

    setFilteredTeachers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeachers();
  };

  const handleTeacherPress = (teacher) => {
    // Navigate to teacher details or show options
    Alert.alert(
      "Teacher Details",
      `${teacher.personalInfo?.firstName} ${teacher.personalInfo?.lastName}`,
      [
        { text: "OK" },
        { 
          text: "View Details", 
          onPress: () => {
            // Navigate to teacher detail screen if available
            // navigation.navigate("TeacherDetail", { teacherId: teacher._id });
          } 
        }
      ]
    );
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.hod || "#6366F1"} />
      
      {/* Fixed Header with Back Button */}
      <View style={[styles.header, { backgroundColor:  "#d72c2c"  }]}>
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

export default DepartmentTeachers;