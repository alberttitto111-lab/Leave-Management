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
  ScrollView,
  Switch,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../utils/constants";

const HEADER_HEIGHT = 100;

const LeaveTypeItem = ({ leaveType, onPress, onDelete }) => (
  <View style={styles.leaveTypeItem}>
    <TouchableOpacity
      style={styles.leaveTypeContent}
      onPress={() => onPress(leaveType)}
    >
      <View
        style={[
          styles.colorIndicator,
          { backgroundColor: leaveType.color || COLORS.primary },
        ]}
      />
      <View style={styles.leaveTypeInfo}>
        <Text style={styles.leaveTypeName}>{leaveType.name}</Text>
        <Text style={styles.leaveTypeCode}>{leaveType.code}</Text>
        <View style={styles.leaveTypeMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Max/Year:</Text>
            <Text style={styles.metaValue}>
              {leaveType.maxDaysPerYear > 0
                ? leaveType.maxDaysPerYear
                : "Unlimited"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Max/Month:</Text>
            <Text style={styles.metaValue}>
              {leaveType.maxDaysPerMonth > 0
                ? leaveType.maxDaysPerMonth
                : "Unlimited"}
            </Text>
          </View>
          {leaveType.requiresDocument && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Doc Required</Text>
            </View>
          )}
        </View>
        <View style={styles.applicableContainer}>
          {leaveType.applicableTo?.map((type, idx) => (
            <View key={idx} style={styles.applicableBadge}>
              <Text style={styles.applicableText}>{type}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.leaveTypeStatus}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: leaveType.isActive ? "#10B981" : "#EF4444" },
          ]}
        />
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => onDelete(leaveType)}
    >
      <Ionicons name="trash-outline" size={20} color="#EF4444" />
    </TouchableOpacity>
  </View>
);

const LeaveTypesManagementScreen = ({ navigation }) => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState(null);
  const [editingLeaveType, setEditingLeaveType] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    color: "#3B82F6",
    maxDaysPerYear: "",
    maxDaysPerMonth: "",
    requiresDocument: false,
    applicableTo: ["all"],
    isPaid: false,
    carryForward: false,
    isActive: true,
  });

  const fetchLeaveTypes = async () => {
    try {
      const response = await api.get("/admin/leave-types");
      setLeaveTypes(response.data.data || []);
    } catch (error) {
      console.error("Fetch leave types error:", error);
      Alert.alert("Error", "Failed to load leave types");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLeaveTypes();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaveTypes();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      color: "#3B82F6",
      maxDaysPerYear: "",
      maxDaysPerMonth: "",
      requiresDocument: false,
      applicableTo: ["all"],
      isPaid: false,
      carryForward: false,
      isActive: true,
    });
    setEditingLeaveType(null);
  };

  const handleAddPress = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEditPress = (leaveType) => {
    setEditingLeaveType(leaveType);
    setFormData({
      name: leaveType.name,
      code: leaveType.code,
      color: leaveType.color,
      maxDaysPerYear: leaveType.maxDaysPerYear?.toString() || "",
      maxDaysPerMonth: leaveType.maxDaysPerMonth?.toString() || "",
      requiresDocument: leaveType.requiresDocument,
      applicableTo: leaveType.applicableTo || ["all"],
      isPaid: leaveType.isPaid || false,
      carryForward: leaveType.carryForward || false,
      isActive: leaveType.isActive,
    });
    setModalVisible(true);
  };

  const handleDeletePress = (leaveType) => {
    setLeaveTypeToDelete(leaveType);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!leaveTypeToDelete) return;

    try {
      const response = await api.delete(
        `/admin/leave-types/${leaveTypeToDelete._id}`,
      );

      if (response.data?.success) {
        setLeaveTypes((prev) =>
          prev.filter((lt) => lt._id !== leaveTypeToDelete._id),
        );
        setDeleteModalVisible(false);
        setLeaveTypeToDelete(null);
        Alert.alert("Success", "Leave type deleted successfully");
      } else {
        Alert.alert("Error", response.data?.message || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to delete leave type",
      );
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        maxDaysPerYear: parseInt(formData.maxDaysPerYear) || 0,
        maxDaysPerMonth: parseInt(formData.maxDaysPerMonth) || 0,
        approvalHierarchy: [{ level: 1, role: "teacher" }],
      };

      if (editingLeaveType) {
        // Update existing
        const response = await api.patch(
          `/admin/leave-types/${editingLeaveType._id}`,
          payload,
        );

        if (response.data?.success) {
          setLeaveTypes((prev) =>
            prev.map((lt) =>
              lt._id === editingLeaveType._id ? response.data.data : lt,
            ),
          );
          Alert.alert("Success", "Leave type updated successfully");
        }
      } else {
        // Create new
        const response = await api.post("/admin/leave-types", payload);

        if (response.data?.success) {
          setLeaveTypes((prev) => [response.data.data, ...prev]);
          Alert.alert("Success", "Leave type created successfully");
        }
      }

      setModalVisible(false);
      resetForm();
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to save leave type",
      );
    }
  };

  const toggleApplicableTo = (type) => {
    const current = formData.applicableTo || [];
    if (current.includes(type)) {
      setFormData({
        ...formData,
        applicableTo: current.filter((t) => t !== type),
      });
    } else {
      setFormData({
        ...formData,
        applicableTo: [...current, type],
      });
    }
  };

  const renderForm = () => (
    <ScrollView style={styles.formContainer}>
      <Text style={styles.formLabel}>Name *</Text>
      <TextInput
        style={styles.formInput}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="e.g., Medical Leave"
      />

      <Text style={styles.formLabel}>Code *</Text>
      <TextInput
        style={styles.formInput}
        value={formData.code}
        onChangeText={(text) =>
          setFormData({ ...formData, code: text.toUpperCase() })
        }
        placeholder="e.g., ML"
        autoCapitalize="characters"
      />

      <Text style={styles.formLabel}>Color</Text>
      <View style={styles.colorContainer}>
        {[
          "#3B82F6",
          "#10B981",
          "#F59E0B",
          "#EF4444",
          "#8B5CF6",
          "#EC4899",
          "#6366F1",
        ].map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              formData.color === color && styles.colorOptionSelected,
            ]}
            onPress={() => setFormData({ ...formData, color })}
          />
        ))}
      </View>

      <Text style={styles.formLabel}>Max Days Per Year (0 = Unlimited)</Text>
      <TextInput
        style={styles.formInput}
        value={formData.maxDaysPerYear}
        onChangeText={(text) =>
          setFormData({ ...formData, maxDaysPerYear: text })
        }
        keyboardType="numeric"
        placeholder="0"
      />

      <Text style={styles.formLabel}>Max Days Per Month (0 = Unlimited)</Text>
      <TextInput
        style={styles.formInput}
        value={formData.maxDaysPerMonth}
        onChangeText={(text) =>
          setFormData({ ...formData, maxDaysPerMonth: text })
        }
        keyboardType="numeric"
        placeholder="0"
      />

      <Text style={styles.formLabel}>Applicable To</Text>
      <View style={styles.applicableContainer}>
        {["student"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.applicableOption,
              formData.applicableTo?.includes(type) &&
                styles.applicableOptionSelected,
            ]}
            onPress={() => toggleApplicableTo(type)}
          >
            <Text
              style={[
                styles.applicableOptionText,
                formData.applicableTo?.includes(type) &&
                  styles.applicableOptionTextSelected,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Requires Document</Text>
        <Switch
          value={formData.requiresDocument}
          onValueChange={(value) =>
            setFormData({ ...formData, requiresDocument: value })
          }
          trackColor={{ false: "#CBD5E1", true: COLORS.primary }}
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Paid Leave</Text>
        <Switch
          value={formData.isPaid}
          onValueChange={(value) => setFormData({ ...formData, isPaid: value })}
          trackColor={{ false: "#CBD5E1", true: COLORS.primary }}
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Carry Forward</Text>
        <Switch
          value={formData.carryForward}
          onValueChange={(value) =>
            setFormData({ ...formData, carryForward: value })
          }
          trackColor={{ false: "#CBD5E1", true: COLORS.primary }}
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Active</Text>
        <Switch
          value={formData.isActive}
          onValueChange={(value) =>
            setFormData({ ...formData, isActive: value })
          }
          trackColor={{ false: "#CBD5E1", true: COLORS.primary }}
        />
      </View>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={[styles.formButton, styles.cancelButton]}
          onPress={() => {
            setModalVisible(false);
            resetForm();
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.formButton, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>
            {editingLeaveType ? "Update" : "Create"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

      {/* Fixed Header */}
      <View style={[styles.header, { backgroundColor: "#7C3AED" }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Leave Types</Text>
            <Text style={styles.headerSubtitle}>
              {leaveTypes.length} type{leaveTypes.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleAddPress} style={styles.addButton}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scroll Area */}
      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
        indicatorStyle="black"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#7C3AED"]}
            tintColor="#7C3AED"
          />
        }
      >
        {/* Spacer for fixed header */}
        <View style={{ height: HEADER_HEIGHT + 10 }} />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading leave types...</Text>
          </View>
        ) : leaveTypes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No leave types found</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={handleAddPress}
            >
              <Text style={styles.addFirstButtonText}>
                Add First Leave Type
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          leaveTypes.map((item) => (
            <LeaveTypeItem
              key={item._id}
              leaveType={item}
              onPress={handleEditPress}
              onDelete={handleDeletePress}
            />
          ))
        )}
        
        {/* Bottom padding for comfortable scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingLeaveType ? "Edit Leave Type" : "Add Leave Type"}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          {renderForm()}
        </SafeAreaView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Ionicons name="warning" size={48} color="#EF4444" />
            <Text style={styles.deleteModalTitle}>Delete Leave Type</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{leaveTypeToDelete?.name}"? This
              action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setLeaveTypeToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmDeleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
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
    backgroundColor: "#ede9f3",
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
    shadowColor: "#6a00ff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.8,
    marginTop: 2,
  },
  addButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  // Scroll content
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  leaveTypeItem: {
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
  leaveTypeContent: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  colorIndicator: {
    width: 12,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  leaveTypeInfo: {
    flex: 1,
  },
  leaveTypeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  leaveTypeCode: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  leaveTypeMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginRight: 4,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  badge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: "#EF4444",
    fontSize: 10,
    fontWeight: "600",
  },
  applicableContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  applicableBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  applicableText: {
    color: "#4338CA",
    fontSize: 10,
    fontWeight: "500",
  },
  leaveTypeStatus: {
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#94A3B8",
    marginTop: 16,
    fontSize: 16,
  },
  addFirstButton: {
    marginTop: 20,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f4f0f7",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#7C3AED",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  formContainer: {
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#373e49",
    marginBottom: 8,
    marginTop: 16,
  },
  formInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#66686a",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    outlineColor: "#ffffff", // Remove default focus outline
  },
  colorContainer: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#474747",
  },
  applicableOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#a6a6a6",
    marginRight: 8,
    marginBottom: 8,
  },
  applicableOptionSelected: { 
    backgroundColor: "#7C3AED",
  },
  applicableOptionText: {
    color: "#000000",
    fontWeight: "500",
  },
  applicableOptionTextSelected: {
    color: "#fff",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: "#000000",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
    marginBottom: 40,
  },
  formButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#aeb2b7",
  },
  cancelButtonText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#7C3AED",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  // Delete modal styles
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
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  deleteModalText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
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
  confirmDeleteButton: {
    backgroundColor: "#EF4444",
  },
  confirmDeleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default LeaveTypesManagementScreen;