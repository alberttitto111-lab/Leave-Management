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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";

const UserItem = ({ user, onPress }) => (
  <TouchableOpacity style={styles.userItem} onPress={() => onPress(user)}>
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
          { backgroundColor: user.isActive ? "#10B981" : "#EF4444" },
        ]}
      />
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </View>
  </TouchableOpacity>
);

const getRoleColor = (role) => {
  const colors = {
    admin: "#7C3AED",
    hod: "#4338CA",
    teacher: "#0D9488",
    student: "#2563EB",
    staff: "#F59E0B",
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

  const roles = ["all", "student", "teacher", "hod", "staff", "admin"];

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
    }, [selectedRole]),
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
      <View style={styles.header}>
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
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: "#F3E8FF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
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
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
});

export default UserManagementScreen;
