// screens/student/LeaveDetailsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { COLORS } from "../../utils/constants";

const HEADER_HEIGHT = 100;

const LeaveDetailsScreen = ({ route, navigation }) => {
  const { leaveId } = route.params;
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [student, setStudent] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchLeaveDetails();
  }, [leaveId]);

  const fetchLeaveDetails = async () => {
    try {
      setLoading(true);
      // Fetch leave details
      const response = await api.get(`/student/leave/${leaveId}`);
      const leaveData = response.data.data;
      setLeave(leaveData);
      
      // Fetch student profile for additional info
      const studentRes = await api.get("/student/profile");
      setStudent(studentRes.data.data);
    } catch (error) {
      console.error("Error fetching leave details:", error);
      Alert.alert("Error", "Failed to load leave details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaveDetails();
  };

  const handleSend = async () => {
    if (!leave) return;
    
    setSending(true);
    try {
      // Format the leave details for sharing
      const studentInfo = student?.personalInfo || {};
      const academicInfo = student?.academicInfo || {};
      const department = student?.departmentId || {};
      
      const message = `
Leave Request Details
--------------------
Request ID: ${leave.requestId || 'N/A'}
Status: ${leave.finalStatus?.toUpperCase() || 'N/A'}
Leave Type: ${leave.leaveType?.name || 'N/A'}
Duration: ${leave.dateRange?.days || 0} day(s)
From: ${new Date(leave.dateRange?.from).toLocaleDateString()}
To: ${new Date(leave.dateRange?.to).toLocaleDateString()}
Reason: ${leave.reason || 'N/A'}

Student Information
------------------
Name: ${studentInfo.firstName || ''} ${studentInfo.lastName || ''}
Class: ${academicInfo.class || 'N/A'} - ${academicInfo.section || 'N/A'}
Roll Number: ${academicInfo.rollNumber || 'N/A'}
User ID: ${student?.userId || 'N/A'}
Department: ${department.name || 'N/A'}
Email: ${studentInfo.email || 'N/A'}
Phone: ${studentInfo.phone || 'N/A'}

Applied on: ${new Date(leave.createdAt).toLocaleString()}
      `;

      await Share.share({
        message: message.trim(),
        title: 'Leave Request Details',
      });
    } catch (error) {
      console.error('Error sharing leave details:', error);
      Alert.alert('Error', 'Failed to share leave details');
    } finally {
      setSending(false);
    }
  };

  const handleNotify = async () => {
  if (!leave) return;
  
  Alert.alert(
    "Send Notification",
    `Send email to ${student?.personalInfo?.email}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        onPress: async () => {
          try {
            setSending(true);
            
            // First, test if we can connect to the email server
            const testResult = await api.post('/email/test-simple', {
              to: student?.personalInfo?.email,
              subject: `Leave Request ${leave.finalStatus} - #${leave.requestId}`,
              message: `
                <h2>Leave Request ${leave.finalStatus.toUpperCase()}</h2>
                <p><strong>Request ID:</strong> #${leave.requestId}</p>
                <p><strong>Status:</strong> ${leave.finalStatus}</p>
                <p><strong>Leave Type:</strong> ${leave.leaveType?.name}</p>
                <p><strong>Duration:</strong> ${leave.dateRange?.days} days</p>
                <p><strong>From:</strong> ${new Date(leave.dateRange?.from).toLocaleDateString()}</p>
                <p><strong>To:</strong> ${new Date(leave.dateRange?.to).toLocaleDateString()}</p>
                <p><strong>Reason:</strong> ${leave.reason}</p>
              `
            });
            
            console.log('Email sent result:', testResult.data);
            
            Alert.alert(
              "Success", 
              `Email sent! Check ${student?.personalInfo?.email} (including spam folder)`,
              [{ text: "OK" }]
            );
            
          } catch (error) {
            console.error('Full error:', error);
            console.error('Error response:', error.response?.data);
            
            let errorMessage = error.response?.data?.message || error.message;
            
            if (errorMessage.includes('Application-specific password required')) {
              errorMessage = 'Gmail App Password required. Please generate an App Password.';
            } else if (errorMessage.includes('Invalid login')) {
              errorMessage = 'Invalid email or password. Check your Gmail credentials.';
            }
            
            Alert.alert("Error", errorMessage);
          } finally {
            setSending(false);
          }
        }
      }
    ]
  );
};


const testEmail = async () => {
  try {
    setSending(true);
    console.log('Testing email with student email:', student?.personalInfo?.email);
    
    // First test if the route exists
    const testResponse = await api.get('/email/test');
    console.log('Route test:', testResponse.data);
    
    // Determine status color and emoji
    const statusEmoji = leave?.finalStatus === 'approved' ? '✅' : leave?.finalStatus === 'rejected' ? '❌' : '⏳';
    const statusColor = leave?.finalStatus === 'approved' ? '#28a745' : leave?.finalStatus === 'rejected' ? '#dc3545' : '#ffc107';
    const statusText = leave?.finalStatus ? leave.finalStatus.toUpperCase() : 'PENDING';
    
    // Get rejection reason if rejected
    const rejectionReason = leave?.finalStatus === 'rejected' 
      ? leave.approvals?.find(a => a.status === 'rejected')?.remarks || leave.rejectionReason || 'No specific reason provided'
      : null;
    
    // Get approval chain details
    const approvalChain = leave?.approvals?.map(approval => {
      const approverName = approval.approverId?.personalInfo?.firstName 
        ? `${approval.approverId.personalInfo.firstName} ${approval.approverId.personalInfo.lastName || ''}`
        : 'Unknown';
      return {
        level: approval.level === 1 ? 'Teacher' : 'HOD',
        status: approval.status,
        by: approverName,
        date: approval.approvedAt || approval.rejectedAt,
        remarks: approval.remarks
      };
    }) || [];
    
    // Create a comprehensive email template
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            line-height: 1.6;
            background-color: #f4f6f9;
            margin: 0;
            padding: 20px;
          }
          .container { 
            max-width: 700px; 
            margin: 0 auto; 
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header { 
            background: ${statusColor}; 
            color: white; 
            padding: 30px; 
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.9;
          }
          .content { 
            padding: 30px; 
          }
          .section {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid ${statusColor};
          }
          .details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .detail-item {
            background: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          .detail-label {
            font-size: 12px;
            color: #6c757d;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #333;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: ${statusColor}20;
            color: ${statusColor};
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin: 10px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #dee2e6;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #495057;
          }
          .info-value {
            color: ${statusColor};
            font-weight: 600;
          }
          .reason-box {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid ${statusColor};
          }
          .rejection-box {
            background: #f8d7da;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #dc3545;
          }
          .rejection-title {
            color: #721c24;
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .rejection-text {
            color: #721c24;
            font-style: italic;
          }
          .approval-chain {
            margin-top: 20px;
          }
          .approval-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border: 1px solid #e9ecef;
          }
          .approval-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          .approver-name {
            font-weight: bold;
            color: #333;
          }
          .approval-status {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-approved {
            background: #d4edda;
            color: #155724;
          }
          .status-rejected {
            background: #f8d7da;
            color: #721c24;
          }
          .approval-date {
            font-size: 12px;
            color: #6c757d;
            margin-top: 4px;
          }
          .remarks {
            font-size: 13px;
            color: #495057;
            font-style: italic;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #dee2e6;
          }
          .student-info {
            background: #e8f4fd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #6c757d;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusEmoji} Leave Request ${statusText}</h1>
            <p>Request ID: #${leave?.requestId || 'N/A'}</p>
          </div>
          
          <div class="content">
            <!-- Student Information -->
            <div class="section">
              <div class="section-title">👤 Student Information</div>
              <div class="details-grid">
                <div class="detail-item">
                  <div class="detail-label">Name</div>
                  <div class="detail-value">${student?.personalInfo?.firstName || ''} ${student?.personalInfo?.lastName || ''}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Class - Section</div>
                  <div class="detail-value">${student?.academicInfo?.class || 'N/A'} - ${student?.academicInfo?.section || 'N/A'}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Roll Number</div>
                  <div class="detail-value">${student?.academicInfo?.rollNumber || 'N/A'}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Department</div>
                  <div class="detail-value">${student?.departmentId?.name || 'N/A'}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Email</div>
                  <div class="detail-value">${student?.personalInfo?.email || 'N/A'}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Phone</div>
                  <div class="detail-value">${student?.personalInfo?.phone || 'N/A'}</div>
                </div>
              </div>
            </div>

            <!-- Leave Details -->
            <div class="section">
              <div class="section-title">📋 Leave Details</div>
              <div class="status-badge">${statusEmoji} Status: ${statusText}</div>
              
              <div class="info-row">
                <span class="info-label">Leave Type:</span>
                <span class="info-value">${leave?.leaveType?.name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Duration:</span>
                <span class="info-value">${leave?.dateRange?.days || 0} day(s)</span>
              </div>
              <div class="info-row">
                <span class="info-label">From Date:</span>
                <span class="info-value">${leave?.dateRange?.from ? new Date(leave.dateRange.from).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">To Date:</span>
                <span class="info-value">${leave?.dateRange?.to ? new Date(leave.dateRange.to).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
              </div>
              ${leave?.halfDay ? `
              <div class="info-row">
                <span class="info-label">Half Day:</span>
                <span class="info-value">Yes</span>
              </div>
              ` : ''}
              
              <div class="reason-box">
                <strong>📝 Reason for Leave:</strong>
                <p style="margin-top: 8px; color: #333;">${leave?.reason || 'N/A'}</p>
              </div>
            </div>

            <!-- Rejection Information (if rejected) -->
            ${leave?.finalStatus === 'rejected' && rejectionReason ? `
            <div class="rejection-box">
              <div class="rejection-title">⚠️ Rejection Details</div>
              <div class="rejection-text">"${rejectionReason}"</div>
            </div>
            ` : ''}

            <!-- Approval Chain -->
            ${approvalChain.length > 0 ? `
            <div class="section">
              <div class="section-title">🔄 Approval Chain</div>
              <div class="approval-chain">
                ${approvalChain.map(item => `
                  <div class="approval-item">
                    <div class="approval-header">
                      <span class="approver-name">${item.level}</span>
                      <span class="approval-status ${item.status === 'approved' ? 'status-approved' : 'status-rejected'}">
                        ${item.status === 'approved' ? '✓ APPROVED' : '✗ REJECTED'}
                      </span>
                    </div>
                    ${item.by !== 'Unknown' ? `<div style="color: #495057; margin-top: 4px;">By: ${item.by}</div>` : ''}
                    ${item.date ? `<div class="approval-date">${new Date(item.date).toLocaleString()}</div>` : ''}
                    ${item.remarks ? `<div class="remarks">Note: ${item.remarks}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}

            <!-- Application Date -->
            <div style="text-align: right; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
              <span style="color: #6c757d;">Applied on: </span>
              <span style="font-weight: 600; color: #333;">${leave?.createdAt ? new Date(leave.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated message from the Leave Management System.</p>
            <p>© ${new Date().getFullYear()} Leave Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send the email with complete details
    const response = await api.post('/email/test-simple', {
      to: student?.personalInfo?.email,
      subject: `${statusEmoji} Leave Request ${statusText} - #${leave?.requestId || 'N/A'}`,
      message: emailHTML
    });
    
    console.log('Test email response:', response.data);
    Alert.alert(
      'Success', 
      `Complete leave details sent to ${student?.personalInfo?.email}! Check your inbox/spam folder.`,
      [{ text: 'OK' }]
    );
    
  } catch (error) {
    console.error('Test email error:', error);
    console.error('Error response data:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    Alert.alert(
      'Error', 
      error.response?.data?.message || error.message || 'Failed to send test email'
    );
  } finally {
    setSending(false);
  }
};

  const getStatusColor = () => {
    if (leave?.finalStatus === "approved") return COLORS.success;
    if (leave?.finalStatus === "rejected") return COLORS.danger;
    return COLORS.warning;
  };

  const getStatusIcon = () => {
    if (leave?.finalStatus === "approved") return "checkmark-circle";
    if (leave?.finalStatus === "rejected") return "close-circle";
    return "time-outline";
  };

  const getStatusText = () => {
    if (leave?.finalStatus === "approved") return "APPROVED";
    if (leave?.finalStatus === "rejected") return "REJECTED";
    if (leave?.status === "approved_by_teacher") return "PENDING HOD";
    return "PENDING";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getApprovalChain = () => {
    if (!leave?.approvals) return [];
    return leave.approvals.map(approval => ({
      level: approval.level === 1 ? "Teacher" : "HOD",
      status: approval.status,
      date: approval.approvedAt || approval.rejectedAt,
      remarks: approval.remarks
    }));
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading leave details...</Text>
      </View>
    );
  }

  if (!leave) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>Leave request not found</Text>
      </View>
    );
  }

  const studentInfo = student?.personalInfo || {};
  const academicInfo = student?.academicInfo || {};
  const department = student?.departmentId || {};
  const approvalChain = getApprovalChain();
  const isFinalized = leave.finalStatus === "approved" || leave.finalStatus === "rejected";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Fixed Header with Send and Notify Buttons */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Leave Details</Text>
            <Text style={styles.headerSubtitle}>
              {leave.requestId || ""}
            </Text>
          </View>

          <View style={styles.headerButtons}>
            {/* <TouchableOpacity 
              onPress={handleNotify} 
              style={styles.notifyButton}
            >
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              <Text style={styles.notifyButtonText}>Notify</Text>
            </TouchableOpacity> */}
            <TouchableOpacity 
  onPress={handleNotify} 
  style={styles.notifyButton}
  disabled={sending}
>
  {sending ? (
    <ActivityIndicator size="small" color="#fff" />
  ) : (
    <>
      <Ionicons name="notifications-outline" size={20} color="#fff" />
      <Text style={styles.notifyButtonText}>Notify</Text>
    </>
  )}
</TouchableOpacity>

{/* Add this temporarily next to your other buttons */}
<TouchableOpacity 
  onPress={testEmail} 
  style={styles.notifyButton}
  disabled={sending}
>
  <Ionicons name="bug" size={20} color="#fff" />
  <Text style={styles.notifyButtonText}>Test</Text>
</TouchableOpacity>

            <TouchableOpacity 
              onPress={handleSend} 
              style={styles.sendButton}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.sendButtonText}>Send</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Spacer for fixed header */}
        <View style={{ height: HEADER_HEIGHT + 10 }} />

        {/* Status Stamp */}
        {isFinalized && (
          <View style={[
            styles.stampContainer,
            leave.finalStatus === "approved" ? styles.approvedStamp : styles.rejectedStamp
          ]}>
            <Ionicons 
              name={leave.finalStatus === "approved" ? "checkmark-done" : "close"} 
              size={40} 
              color={leave.finalStatus === "approved" ? COLORS.success : COLORS.danger} 
            />
            <Text style={[
              styles.stampText,
              leave.finalStatus === "approved" ? styles.approvedStampText : styles.rejectedStampText
            ]}>
              {leave.finalStatus === "approved" ? "APPROVED" : "REJECTED"}
            </Text>
          </View>
        )}

        {/* Student Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>
              {studentInfo.firstName || ""} {studentInfo.lastName || ""}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Class - Section:</Text>
            <Text style={styles.infoValue}>
              {academicInfo.class || "N/A"} - {academicInfo.section || "N/A"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Roll Number:</Text>
            <Text style={styles.infoValue}>{academicInfo.rollNumber || "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID:</Text>
            <Text style={styles.infoValue}>{student?.userId || "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department:</Text>
            <Text style={styles.infoValue}>{department.name || "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{studentInfo.email || "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{studentInfo.phone || "N/A"}</Text>
          </View>
        </View>

        {/* Leave Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leave Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Request ID:</Text>
            <Text style={styles.infoValue}>#{leave.requestId}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Leave Type:</Text>
            <View style={styles.leaveTypeBadge}>
              <View style={[styles.colorDot, { backgroundColor: leave.leaveType?.color || COLORS.primary }]} />
              <Text style={styles.leaveTypeText}>{leave.leaveType?.name || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>{leave.dateRange?.days || 0} day(s)</Text>
          </View>

          <View style={styles.dateRangeContainer}>
            <View style={styles.dateBox}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>{formatDate(leave.dateRange?.from)}</Text>
            </View>

            <View style={styles.dateArrow}>
              <Ionicons name="arrow-forward" size={20} color={COLORS.slateLight} />
            </View>

            <View style={styles.dateBox}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>{formatDate(leave.dateRange?.to)}</Text>
            </View>
          </View>

          {leave.halfDay && (
            <View style={styles.halfDayBadge}>
              <Ionicons name="time-outline" size={14} color={COLORS.primary} />
              <Text style={styles.halfDayText}>Half Day Leave</Text>
            </View>
          )}

          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{leave.reason}</Text>
          </View>
        </View>

        {/* Approval Chain Card */}
        {approvalChain.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Approval Status</Text>
            
            {approvalChain.map((item, index) => (
              <View key={index} style={styles.approvalItem}>
                <View style={styles.approvalHeader}>
                  <View style={styles.approverInfo}>
                    <View style={[
                      styles.approvalDot,
                      { backgroundColor: item.status === "approved" ? COLORS.success : COLORS.danger }
                    ]} />
                    <Text style={styles.approverName}>{item.level}</Text>
                  </View>
                  <View style={[
                    styles.approvalStatusBadge,
                    { backgroundColor: item.status === "approved" ? COLORS.success + "20" : COLORS.danger + "20" }
                  ]}>
                    <Ionicons 
                      name={item.status === "approved" ? "checkmark" : "close"} 
                      size={12} 
                      color={item.status === "approved" ? COLORS.success : COLORS.danger} 
                    />
                    <Text style={[
                      styles.approvalStatusText,
                      { color: item.status === "approved" ? COLORS.success : COLORS.danger }
                    ]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                {item.date && (
                  <Text style={styles.approvalDate}>
                    {new Date(item.date).toLocaleString()}
                  </Text>
                )}
                
                {item.remarks && (
                  <Text style={styles.approvalRemarks}>Note: {item.remarks}</Text>
                )}
              </View>
            ))}

            <View style={styles.finalStatusContainer}>
              <Text style={styles.finalStatusLabel}>Final Status:</Text>
              <View style={[
                styles.finalStatusBadge,
                { backgroundColor: getStatusColor() + "20" }
              ]}>
                <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
                <Text style={[styles.finalStatusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Attachments Card */}
        {leave.attachments && leave.attachments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Attachments</Text>
            {leave.attachments.map((file, index) => (
              <View key={index} style={styles.attachmentItem}>
                <Ionicons name="document-attach" size={20} color={COLORS.primary} />
                <Text style={styles.attachmentName}>{file.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Applied Date */}
        <Text style={styles.appliedDate}>
          Applied on: {new Date(leave.createdAt).toLocaleString()}
        </Text>

        {/* Bottom padding for comfortable scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecf2f4",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.slate,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.danger,
  },
  // Header styles - fixed position
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  notifyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  notifyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Scroll content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  // Stamp styles
  stampContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderRadius: 16,
    backgroundColor: COLORS.white,
  },
  approvedStamp: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + "10",
  },
  rejectedStamp: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger + "10",
  },
  stampText: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  approvedStampText: {
    color: COLORS.success,
  },
  rejectedStampText: {
    color: COLORS.danger,
  },
  // Card styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slateDark,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight + "30",
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: "500",
    flex: 0.4,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.slateDark,
    fontWeight: "600",
    flex: 0.6,
    textAlign: "right",
  },
  // Leave type styles
  leaveTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.6,
    justifyContent: "flex-end",
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  leaveTypeText: {
    fontSize: 14,
    color: COLORS.slateDark,
    fontWeight: "600",
  },
  // Date range styles
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 12,
  },
  dateBox: {
    flex: 1,
    backgroundColor: COLORS.grayLight + "20",
    padding: 12,
    borderRadius: 12,
  },
  dateArrow: {
    paddingHorizontal: 8,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.slateLight,
    marginTop: 4,
  },
  dateValue: {
    fontSize: 13,
    color: COLORS.slateDark,
    fontWeight: "600",
    marginTop: 2,
  },
  halfDayBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  halfDayText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 4,
  },
  // Reason styles
  reasonContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.grayLight + "20",
    borderRadius: 12,
  },
  reasonLabel: {
    fontSize: 12,
    color: COLORS.slate,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: COLORS.slateDark,
    lineHeight: 20,
  },
  // Approval chain styles
  approvalItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight + "30",
  },
  approvalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  approverInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  approvalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  approverName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  approvalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  approvalStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  approvalDate: {
    fontSize: 11,
    color: COLORS.slateLight,
    marginBottom: 4,
  },
  approvalRemarks: {
    fontSize: 12,
    color: COLORS.slate,
    fontStyle: "italic",
  },
  finalStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  finalStatusLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slateDark,
  },
  finalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  finalStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  // Attachment styles
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.grayLight + "20",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  attachmentName: {
    fontSize: 13,
    color: COLORS.slateDark,
    marginLeft: 8,
    flex: 1,
  },
  appliedDate: {
    fontSize: 11,
    color: COLORS.slateLight,
    textAlign: "center",
    marginTop: 8,
  },
});

export default LeaveDetailsScreen;