import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../../api/axiosConfig";

const LeaveRequestScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [formData, setFormData] = useState({
        leaveTypeId: "",
        fromDate: new Date(),
        toDate: new Date(),
        reason: "",
        halfDay: null, // 'morning' | 'afternoon' | null
        attachments: [],
    });

    const [dateDefaults, setDateDefaults] = useState({
        showFrom: false,
        showTo: false,
    });

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        try {
            const response = await apiClient.get("/student/leave-types");
            setLeaveTypes(response.data.data);
            if (response.data.data.length > 0) {
                setFormData((prev) => ({
                    ...prev,
                    leaveTypeId: response.data.data[0]._id,
                }));
            }
        } catch (error) {
            console.error("Error fetching leave types:", error);
            Alert.alert("Error", "Failed to load leave types");
        }
    };

    const handleDateChange = (event, selectedDate, type) => {
        const currentDate = selectedDate || formData[type];
        setDateDefaults((prev) => ({
            ...prev,
            showFrom: false,
            showTo: false,
        }));

        if (type === "fromDate") {
            setFormData((prev) => ({
                ...prev,
                fromDate: currentDate,
                // Auto-update toDate if it's before new fromDate
                toDate: currentDate > prev.toDate ? currentDate : prev.toDate,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                toDate: currentDate,
            }));
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["image/*", "application/pdf"],
                multiple: true,
            });

            if (!result.canceled && result.assets) {
                setFormData((prev) => ({
                    ...prev,
                    attachments: [...prev.attachments, ...result.assets],
                }));
            }
        } catch (err) {
            console.error("Unknown error picker:", err);
        }
    };

    const removeAttachment = (index) => {
        setFormData((prev) => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async () => {
        if (!formData.reason.trim()) {
            return Alert.alert("Required", "Please provide a reason for leave");
        }

        try {
            setLoading(true);

            const data = new FormData();
            data.append("leaveTypeId", formData.leaveTypeId);
            data.append("fromDate", formData.fromDate.toISOString());
            data.append("toDate", formData.toDate.toISOString());
            data.append("reason", formData.reason);
            if (formData.halfDay) data.append("halfDay", formData.halfDay);

            formData.attachments.forEach((file, index) => {
                data.append("attachments", {
                    uri: Platform.OS === "android" ? file.uri : file.uri.replace("file://", ""),
                    name: file.name,
                    type: file.mimeType || "application/octet-stream",
                });
            });

            await apiClient.post("/student/leave-request", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            Alert.alert("Success", "Leave request submitted successfully", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Submission failed";
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Apply for Leave</Text>
                <TouchableOpacity onPress={handleSubmit} disabled={loading}>
                    <Text style={[styles.submitBtn, loading && { opacity: 0.5 }]}>
                        Submit
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Leave Type */}
                <Text style={styles.label}>Leave Type</Text>
                <View style={styles.typeContainer}>
                    {leaveTypes.map((type) => (
                        <TouchableOpacity
                            key={type._id}
                            style={[
                                styles.typeChip,
                                formData.leaveTypeId === type._id && styles.activeTypeChip,
                            ]}
                            onPress={() =>
                                setFormData((prev) => ({ ...prev, leaveTypeId: type._id }))
                            }
                        >
                            <Text
                                style={[
                                    styles.typeText,
                                    formData.leaveTypeId === type._id && styles.activeTypeText,
                                ]}
                            >
                                {type.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Date Selection */}
                <View style={styles.row}>
                    <View style={styles.dateField}>
                        <Text style={styles.label}>From Date</Text>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() =>
                                setDateDefaults((prev) => ({ ...prev, showFrom: true }))
                            }
                        >
                            <Text>{formData.fromDate.toLocaleDateString()}</Text>
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        {dateDefaults.showFrom && (
                            <DateTimePicker
                                value={formData.fromDate}
                                mode="date"
                                display="default"
                                onChange={(e, d) => handleDateChange(e, d, "fromDate")}
                                minimumDate={new Date()}
                            />
                        )}
                    </View>

                    <View style={styles.dateField}>
                        <Text style={styles.label}>To Date</Text>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() =>
                                setDateDefaults((prev) => ({ ...prev, showTo: true }))
                            }
                        >
                            <Text>{formData.toDate.toLocaleDateString()}</Text>
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        {dateDefaults.showTo && (
                            <DateTimePicker
                                value={formData.toDate}
                                mode="date"
                                display="default"
                                onChange={(e, d) => handleDateChange(e, d, "toDate")}
                                minimumDate={formData.fromDate}
                            />
                        )}
                    </View>
                </View>

                {/* Reason */}
                <Text style={styles.label}>Reason</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Enter detailed reason for leave..."
                    multiline
                    numberOfLines={4}
                    value={formData.reason}
                    onChangeText={(text) =>
                        setFormData((prev) => ({ ...prev, reason: text }))
                    }
                    textAlignVertical="top"
                />

                {/* Attachments */}
                <View style={styles.attachHeader}>
                    <Text style={styles.label}>Attachments (Optional)</Text>
                    <TouchableOpacity onPress={pickDocument}>
                        <Text style={styles.addBtn}>+ Add File</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.fileList}>
                    {formData.attachments.map((file, index) => (
                        <View key={index} style={styles.fileItem}>
                            <Text style={styles.fileName} numberOfLines={1}>
                                {file.name}
                            </Text>
                            <TouchableOpacity onPress={() => removeAttachment(index)}>
                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1F2937",
    },
    submitBtn: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2563EB",
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#374151",
        marginBottom: 8,
        marginTop: 16,
    },
    typeContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    typeChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    activeTypeChip: {
        backgroundColor: "#EFF6FF",
        borderColor: "#2563EB",
    },
    typeText: {
        color: "#4B5563",
        fontSize: 14,
    },
    activeTypeText: {
        color: "#2563EB",
        fontWeight: "500",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
    },
    dateField: {
        flex: 1,
    },
    dateInput: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        backgroundColor: "#fff",
    },
    textArea: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 12,
        backgroundColor: "#fff",
        minHeight: 100,
    },
    attachHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
        marginBottom: 8,
    },
    addBtn: {
        color: "#2563EB",
        fontWeight: "500",
    },
    fileList: {
        marginTop: 8,
    },
    fileItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    fileName: {
        flex: 1,
        marginRight: 8,
        color: "#4B5563",
    },
});

export default LeaveRequestScreen;
