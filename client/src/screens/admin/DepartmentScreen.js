import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";
import { useFocusEffect } from "@react-navigation/native";

const DepartmentsScreen = ({ navigation }) => {
  const [departments, setDepartments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/admin/departments");
      setDepartments(res.data);
    } catch (err) {
      console.error("Fetch departments error:", err);
      Alert.alert("Error", "Failed to load departments");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDepartments();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDepartments();
    setRefreshing(false);
  };

  const handleDeletePress = (department) => {
    setDepartmentToDelete(department);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete) return;
    
    setDeleting(true);
    try {
      const response = await api.delete(`/admin/departments/${departmentToDelete._id}`);
      
      if (response.data?.success) {
        // Remove from local state immediately
        setDepartments(prev => prev.filter(dept => dept._id !== departmentToDelete._id));
        setDeleteModalVisible(false);
        setDepartmentToDelete(null);
        Alert.alert("Success", "Department permanently deleted successfully");
      } else {
        Alert.alert("Error", response.data?.message || "Failed to delete department");
      }
    } catch (err) {
      console.error("Delete department error:", err);
      
      // Handle specific error messages
      if (err.response?.status === 400) {
        Alert.alert(
          "Cannot Delete Department",
          err.response.data?.message || "This department has assigned users. Please reassign or delete the users first."
        );
      } else if (err.response?.status === 404) {
        Alert.alert("Error", "Department not found");
        // Refresh the list
        fetchDepartments();
      } else {
        Alert.alert(
          "Error",
          err.response?.data?.message || "Failed to delete department"
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleAddDepartment = () => {
    navigation.navigate("AddEditDepartment", {
      onGoBack: () => fetchDepartments() // Callback to refresh when coming back
    });
  };

  const handleEditDepartment = (department) => {
    navigation.navigate("AddEditDepartment", {
      department: department,
      onGoBack: () => fetchDepartments() // Callback to refresh when coming back
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleEditDepartment(item)}
      >
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.code}>Code: {item.code}</Text>
          {item.hodId && (
            <Text style={styles.hod}>
              HOD: {item.hodId?.personalInfo?.firstName} {item.hodId?.personalInfo?.lastName}
            </Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: item.isActive ? COLORS.success + '20' : COLORS.danger + '20' }]}>
            <Text style={[styles.statusText, { color: item.isActive ? COLORS.success : COLORS.danger }]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <Icon name="pencil" size={22} color={COLORS.info} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePress(item)}
      >
        <Icon name="delete" size={22} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
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
          <View style={styles.emptyState}>
            <Icon name="office-building-remove" size={64} color={COLORS.slateLight} />
            <Text style={styles.emptyText}>No departments found</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={handleAddDepartment}
            >
              <Text style={styles.addFirstButtonText}>Add First Department</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddDepartment}
      >
        <Icon name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon name="alert-octagon" size={48} color={COLORS.danger} style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Delete Department</Text>
            <Text style={styles.modalText}>
              Are you sure you want to permanently delete "{departmentToDelete?.name}"?
              This action CANNOT be undone. All data associated with this department will be
              permanently removed from the database.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDepartmentToDelete(null);
                }}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Text style={styles.confirmButtonText}>Deleting...</Text>
                ) : (
                  <Text style={styles.confirmButtonText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    padding: 16 
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 12,
  },
  name: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: COLORS.slateDark 
  },
  code: { 
    fontSize: 13, 
    color: COLORS.slate, 
    marginTop: 4 
  },
  hod: {
    fontSize: 12,
    color: COLORS.info,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 10,
    borderRadius: 8,
    // backgroundColor: COLORS.danger + '15',
    // borderWidth: 1,
    // borderColor: COLORS.danger + '30',
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: { 
    textAlign: "center", 
    marginTop: 16,
    color: COLORS.slate,
    fontSize: 16,
  },
  addFirstButton: {
    marginTop: 20,
    backgroundColor: COLORS.info,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
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
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.slateDark,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.slate,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.grayLight,
  },
  cancelButtonText: {
    color: COLORS.slate,
    fontWeight: "600",
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: COLORS.danger,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 15,
  },
});

export default DepartmentsScreen;