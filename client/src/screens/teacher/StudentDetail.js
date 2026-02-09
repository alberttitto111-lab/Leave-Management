// screens/teacher/StudentDetail.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "—"}</Text>
  </View>
);

const StudentDetail = ({ route }) => {
  const { studentId } = route.params;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStudent = async () => {
    try {
      const res = await api.get(`/teacher/students/${studentId}`);
      setStudent(res.data.data);
    } catch (err) {
      console.error("Failed to load student:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudent();
  }, [studentId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudent();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={{ marginTop: 10 }}>Loading student details...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#CBD5E1" />
        <Text style={{ marginTop: 10 }}>Student not found</Text>
      </View>
    );
  }

  const p = student.personalInfo || {};
  const a = student.academicInfo || {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {p.firstName?.[0]}
            {p.lastName?.[0]}
          </Text>
        </View>

        <Text style={styles.name}>
          {p.firstName} {p.lastName}
        </Text>
        <Text style={styles.userId}>{student.userId}</Text>
      </View>

      {/* Academic Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Academic Information</Text>
        <InfoRow label="Class" value={a.class} />
        <InfoRow label="Section" value={a.section} />
        <InfoRow label="Roll Number" value={a.rollNumber} />
        <InfoRow
          label="Department"
          value={a.departmentId?.name || student.departmentId?.name}
        />
      </View>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        <InfoRow label="Email" value={p.email} />
        <InfoRow label="Phone" value={p.phone} />
        <InfoRow label="Gender" value={p.gender} />
        <InfoRow
          label="Date of Birth"
          value={p.dateOfBirth ? new Date(p.dateOfBirth).toDateString() : null}
        />
        <InfoRow label="Address" value={p.address} />
      </View>

      {/* Account Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <InfoRow label="Role" value={student.role} />
        <InfoRow label="Active" value={student.isActive ? "Yes" : "No"} />
        <InfoRow
          label="Last Login"
          value={
            student.lastLogin
              ? new Date(student.lastLogin).toLocaleString()
              : null
          }
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCard: {
    backgroundColor: "#7C3AED",
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  userId: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    margin: 15,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1E293B",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    maxWidth: "60%",
    textAlign: "right",
  },
});

export default StudentDetail;
