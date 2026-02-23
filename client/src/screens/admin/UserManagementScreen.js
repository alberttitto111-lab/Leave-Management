import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  SafeAreaView,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../utils/constants";

const UserItem = ({ user, onPress, onDelete }) => (
  <View style={styles.userItem}>
    <TouchableOpacity style={styles.userContent} onPress={() => onPress(user)}>
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>
          {user.personalInfo?.firstName?.[0]}
          {user.personalInfo?.lastName?.[0]}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {user.personalInfo?.firstName} {user.personalInfo?.lastName}
        </Text>
        <Text style={styles.userId}>{user.userId}</Text>
        <View style={styles.userMeta}>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: getRoleColor(user.role) },
            ]}
          >
            <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
          </View>
          {user.departmentId && (
            <Text style={styles.deptText}>{user.departmentId.name}</Text>
          )}
        </View>
      </View>
      <View style={styles.userStatus}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: user.isActive ? "#10b948" : "#f41b1b" },
          ]}
        />
        <Ionicons name="chevron-forward" size={20} color="#989da4" />
      </View>
    </TouchableOpacity>
    {/* Delete Button */}
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => onDelete(user)}
    >
      <Ionicons name="trash-outline" size={20} color="#EF4444" />
    </TouchableOpacity>
  </View>
);

const getRoleColor = (role) => {
  const colors = {
    admin: "#ec2b2b",
    hod: "#eb862d",
    teacher: "#0d944a",
    student: "#2461e5",
    // staff: "#c847c8",
  };
  return colors[role] || "#64748B";
};

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const roles = ["all", "student", "teacher", "hod", "admin"];

  const fetchUsers = async (pageNum = 1, shouldRefresh = false) => {
    try {
      const params = {
        page: pageNum,
        limit: 20,
        ...(selectedRole !== "all" && { role: selectedRole }),
        ...(searchQuery && { search: searchQuery }),
      };
      const response = await api.get("/admin/users", { params });
      
      if (shouldRefresh) {
        setUsers(response.data.users);
      } else {
        setUsers((prev) => [...prev, ...response.data.users]);
      }
      setHasMore(response.data.users.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers(1, true);
    }, [selectedRole])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchUsers(page + 1);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchUsers(1, true);
  };

  const handleDeletePress = (user) => {
    console.log("Opening delete modal for user:", user.userId);
    setUserToDelete(user);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    console.log("=== CONFIRM DELETE STARTED ===");
    console.log("User to delete:", userToDelete?._id);
    
    if (!userToDelete) {
      console.error("No user set to delete!");
      return;
    }

    try {
      console.log(
        "Making API delete call to:",
        `/admin/users/${userToDelete._id}`
      );
      const response = await api.delete(`/admin/users/${userToDelete._id}`);
      console.log("API Response:", response.data);
      
      if (response.data?.success) {
        console.log("Delete successful, removing from local state");
        setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
        setDeleteModalVisible(false);
        setUserToDelete(null);
        Alert.alert("Success", "User deleted successfully");
      } else {
        console.error("Server returned success:false", response.data);
        Alert.alert("Error", response.data?.message || "Failed to delete user");
      }
    } catch (err) {
      console.error("=== API ERROR ===");
      console.error("Error type:", err.name);
      console.error("Error message:", err.message);
      
      if (err.response) {
        console.error("Server responded with error:");
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
        Alert.alert(
          "Server Error",
          err.response?.data?.message || `Error ${err.response.status}`
        );
      } else if (err.request) {
        console.error("No response received - network error");
        Alert.alert(
          "Network Error",
          "Cannot connect to server. Check your network and server status."
        );
      } else {
        console.error("Request setup error:", err.message);
        Alert.alert("Error", "Failed to make request: " + err.message);
      }
    }
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#7C3AED" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.admin} />
      
      {/* Updated Header with Back Button - Matching AddUserScreen style */}
      <View style={[styles.header, { backgroundColor: COLORS.admin }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Users</Text>
            <Text style={styles.headerSubtitle}>Manage system users</Text>
          </View>
          
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar - Moved below header */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#64748B"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, or email..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                handleSearch();
              }}
            >
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>Showing {users.length} users</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddUser")}>
          <Text style={styles.addText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        renderItem={({ item }) => (
          <UserItem
            user={item}
            onPress={(user) =>
              navigation.navigate("EditUser", { userId: user._id })
            }
            onDelete={handleDeletePress}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          )
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Role</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>
            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleOption,
                  selectedRole === role && styles.roleOptionSelected,
                ]}
                onPress={() => {
                  setSelectedRole(role);
                  setShowFilterModal(false);
                  setLoading(true);
                }}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === role && styles.roleOptionTextSelected,
                  ]}
                >
                  {role === "all"
                    ? "All Users"
                    : role.charAt(0).toUpperCase() + role.slice(1) + "s"}
                </Text>
                {selectedRole === role && (
                  <Ionicons name="checkmark" size={20} color="#7C3AED" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Ionicons
              name="warning"
              size={48}
              color="#EF4444"
              style={styles.deleteModalIcon}
            />
            <Text style={styles.deleteModalTitle}>Delete User</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete{" "}
              {userToDelete?.personalInfo?.firstName}{" "}
              {userToDelete?.personalInfo?.lastName} ({userToDelete?.userId})?
              This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => {
                  console.log("Modal cancel pressed");
                  setDeleteModalVisible(false);
                  setUserToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmDeleteButton]}
                onPress={() => {
                  console.log("Modal confirm delete pressed");
                  confirmDelete();
                }}
              >
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1efff",
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#9900ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    outlineColor: "transparent", // Remove default focus outline
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsText: {
    color: "#64748B",
    fontSize: 14,
  },
  addText: {
    color: "#7C3AED",
    fontWeight: "600",
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userContent: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  userId: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  deptText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  userStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteButton: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#94A3B8",
    marginTop: 16,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  roleOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  roleOptionSelected: {
    backgroundColor: "#F3E8FF",
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  roleOptionText: {
    fontSize: 16,
    color: "#475569",
    textTransform: "capitalize",
  },
  roleOptionTextSelected: {
    color: "#7C3AED",
    fontWeight: "600",
  },
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  deleteModalIcon: {
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  deleteModalText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
  },
  cancelButtonText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 15,
  },
  confirmDeleteButton: {
    backgroundColor: "#EF4444",
  },
  confirmDeleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});

export default UserManagementScreen;