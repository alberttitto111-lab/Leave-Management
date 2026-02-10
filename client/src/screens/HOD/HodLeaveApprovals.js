import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";

const HodLeaveApprovals = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ---------------- LOAD LEAVES ---------------- */

  const loadLeaves = async () => {
    try {
      const res = await api.get("/hod/pending-leaves");
      setLeaves(res.data.data || []);
    } catch (err) {
      console.log("Load HOD leaves error:", err.response?.data || err);
      Alert.alert("Error", "Failed to load leaves");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLeaves();
  }, []);

  /* ---------------- ACTION ---------------- */

  const handleAction = async (id, action) => {
    try {
      await api.post(`/hod/action/${id}`, {
        action,
        remark: "",
      });

      Alert.alert("Success", `Leave ${action}d successfully`);
      loadLeaves();
    } catch (err) {
      console.log("HOD action error:", err.response?.data || err);
      Alert.alert("Error", "Action failed");
    }
  };

  /* ---------------- RENDER ITEM ---------------- */

  const renderItem = ({ item }) => {
    const from = item?.dateRange?.from
      ? new Date(item.dateRange.from).toDateString()
      : "-";

    const to = item?.dateRange?.to
      ? new Date(item.dateRange.to).toDateString()
      : "-";

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>
            {item.applicantId?.name || "Unknown Student"}
          </Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>Teacher Approved</Text>
          </View>
        </View>

        <Text style={styles.type}>{item.leaveType?.name || "Leave"}</Text>

        <Text style={styles.date}>
          {from} → {to}
        </Text>

        <Text style={styles.reason}>{item.reason}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.btn, styles.approveBtn]}
            onPress={() => handleAction(item._id, "approve")}
          >
            <Icon name="check" size={18} color="#fff" />
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            onPress={() => handleAction(item._id, "reject")}
          >
            <Icon name="close" size={18} color="#fff" />
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.hod || "#7C3AED"} />
      </View>
    );
  }

  return (
    <FlatList
      data={leaves}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Icon name="inbox-outline" size={48} color="#CBD5E1" />
          <Text style={styles.empty}>No pending leaves</Text>
        </View>
      }
    />
  );
};

export default HodLeaveApprovals;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  badge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
  },

  type: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },

  date: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  reason: {
    marginTop: 8,
    fontSize: 14,
    color: "#475569",
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  approveBtn: {
    backgroundColor: "#16A34A",
  },

  rejectBtn: {
    backgroundColor: "#DC2626",
  },

  btnText: {
    color: "#fff",
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  empty: {
    marginTop: 10,
    color: "#94A3B8",
  },
});
