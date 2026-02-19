import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { USER_ROLES } from "../utils/constants";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import ChangePasswordScreen from "../screens/auth/ChangePasswordScreen";

// Admin Screens
import AdminDashboard from "../screens/dashboard/AdminDashboard";
import UserManagementScreen from "../screens/admin/UserManagementScreen";
import AddUserScreen from "../screens/admin/AddUserScreen";
import BulkUploadScreen from "../screens/admin/BulkUploadScreen";
import DepartmentsScreen from "../screens/admin/DepartmentScreen";
import AddEditDepartmentScreen from "../screens/admin/AddEditDepartmentScreen";
import EditUserScreen from "../screens/admin/EditUserScreen";
import LeaveTypesManagementScreen from "../screens/admin/LeaveTypesManagementScreen";

// HOD Screens
import HODDashboard from "../screens/HOD/HODDashboard";
import HodLeaveApprovals from "../screens/HOD/HodLeaveApprovals";
import DepartmentTeachers from "../screens/HOD/DepartmentTeachers";
import DepartmentStudents from "../screens/HOD/DepartmentStudents";

// Teacher Screens
import TeacherDashboard from "../screens/teacher/TeacherDashboard";
import TeacherProfile from "../screens/teacher/TeacherProfile";
import StudentList from "../screens/teacher/StudentList";
import StudentDetail from "../screens/teacher/StudentDetail";
import TeacherLeaveRequestsScreen from "../screens/teacher/TeacherLeaveRequestsScreen";
import TeacherLeaveHistoryScreen from "../screens/teacher/TeacherLeaveHistoryScreen";

// Import the new screens
import TeacherApprovalsScreen from "../screens/teacher/TeacherApprovalsScreen";
import TeacherRejectedScreen from "../screens/teacher/TeacherRejectedScreen";

// Student Screens
import StudentDashboard from "../screens/student/StudentDashboard";
import LeaveHistoryScreen from "../screens/student/LeaveHistoryScreen";

import EditStudentProfileScreen from "../screens/student/EditStudentProfileScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const StudentStack = createStackNavigator();

// Custom Disabled Tab Component
const DisabledTab = ({ label, iconName, color }) => (
  <View style={styles.disabledTabContainer}>
    <View style={styles.iconWrapper}>
      <Ionicons name={iconName} size={24} color={color} />
      <View style={styles.lockBadge}>
        <Ionicons name="lock-closed" size={10} color="#fff" />
      </View>
    </View>
    <Text style={[styles.disabledTabLabel, { color }]}>{label}</Text>
    <View style={styles.comingSoonRibbon}>
      <Text style={styles.comingSoonText}>SOON</Text>
    </View>
  </View>
);

/* -------------------- STUDENT STACK NAVIGATOR -------------------- */

const StudentStackNavigator = () => (
  <StudentStack.Navigator screenOptions={{ headerShown: false }}>
    <StudentStack.Screen name="StudentHome" component={StudentDashboard} />
    <StudentStack.Screen
      name="LeaveHistory"
      component={LeaveHistoryScreen}
      options={{
        headerShown: false,
        title: "Leave History",
        headerStyle: { backgroundColor: "#2563EB" },
        headerTintColor: "#fff",
      }}
    />
  </StudentStack.Navigator>
);

/* -------------------- ROLE TAB NAVIGATORS -------------------- */

const StudentTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === "Home") iconName = focused ? "home" : "home-outline";
        else if (route.name === "Apply")
          iconName = focused ? "add-circle" : "add-circle-outline";
        else if (route.name === "History")
          iconName = focused ? "time" : "time-outline";
        else if (route.name === "Profile")
          iconName = focused ? "person" : "person-outline";
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#2563EB",
      tabBarInactiveTintColor: "gray",
    })}
  >
    <Tab.Screen options={{ 
        headerShown: false,
        tabBarLabel: "Home",
      }}
      name="Home" component={StudentStackNavigator} />

    <Tab.Screen options={{ 
        headerShown: false,
        tabBarLabel: "Apply",
      }}
      name="Apply" 
      component={StudentDashboard} />

    <Tab.Screen options={{ 
        headerShown: false,
        tabBarLabel: "History",
      }}
      name="History" component={LeaveHistoryScreen} />

    <Tab.Screen options={{ 
        headerShown: false,
        tabBarLabel: "Profile",
      }}
    name="Profile" component={StudentDashboard} />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        
        // Disabled tabs get a different treatment
        if (route.name === "Reports" || route.name === "Settings") {
          return (
            <View style={styles.disabledIconContainer}>
              <Ionicons 
                name={route.name === "Reports" ? "bar-chart" : "settings"} 
                size={size} 
                color="#9CA3AF" 
              />
              <View style={styles.smallLockBadge}>
                <Ionicons name="lock-closed" size={8} color="#fff" />
              </View>
            </View>
          );
        }
        
        if (route.name === "Dashboard")
          iconName = focused ? "home" : "home-outline";
        else if (route.name === "Users")
          iconName = focused ? "people" : "people-outline";
        
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#7C3AED",
      tabBarInactiveTintColor: "gray",
      tabBarStyle: { height: 60, paddingBottom: 5, paddingTop: 5 },
    })}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={AdminDashboard} 
      options={{
        headerShown: false,
        tabBarLabel: "Dashboard",
      }}
    />
    
    <Tab.Screen
      options={{ 
        headerShown: false,
        tabBarLabel: "Users",
      }}
      name="Users"
      component={UserManagementScreen}
    />
    
    {/* Disabled Bulk upload Tab */}
    <Tab.Screen
      name="Bulk Upload"
      component={View} // Empty component
      options={{
        tabBarLabel: ({ color }) => (
          <View style={styles.disabledLabelContainer}>
            <Text style={[styles.disabledLabel, { color: "#9CA3AF" }]}>Bulk Upload</Text>
          </View>
        ),
        tabBarButton: (props) => (
          <View style={styles.disabledTabButton}>
            <View style={styles.disabledContent}>
              {props.children}
            </View>
          </View>
        ),
        tabBarIcon: ({ size }) => (
          <View style={styles.disabledIconContainer}>
            <Ionicons name="cloud-upload" size={size} color="#9CA3AF" />
            <View style={styles.lockBadgeSmall}>
              <Ionicons name="lock-closed" size={8} color="#fff" />
            </View>
          </View>
        ),
      }}
      listeners={{
        tabPress: (e) => {
          // Prevent navigation
          e.preventDefault();
        },
      }}
    />

    {/* Disabled Reports Tab */}
    <Tab.Screen
      name="Reports"
      component={View} // Empty component
      options={{
        tabBarLabel: ({ color }) => (
          <View style={styles.disabledLabelContainer}>
            <Text style={[styles.disabledLabel, { color: "#9CA3AF" }]}>Reports</Text>
          </View>
        ),
        tabBarButton: (props) => (
          <View style={styles.disabledTabButton}>
            <View style={styles.disabledContent}>
              {props.children}
            </View>
          </View>
        ),
        tabBarIcon: ({ size }) => (
          <View style={styles.disabledIconContainer}>
            <Ionicons name="bar-chart" size={size} color="#9CA3AF" />
            <View style={styles.lockBadgeSmall}>
              <Ionicons name="lock-closed" size={8} color="#fff" />
            </View>
          </View>
        ),
      }}
      listeners={{
        tabPress: (e) => {
          // Prevent navigation
          e.preventDefault();
        },
      }}
    />
    
    {/* Disabled Settings Tab */}
    <Tab.Screen
      name="Settings"
      component={View} // Empty component
      options={{
        tabBarLabel: ({ color }) => (
          <View style={styles.disabledLabelContainer}>
            <Text style={[styles.disabledLabel, { color: "#9CA3AF" }]}>Settings</Text>
          </View>
        ),
        tabBarButton: (props) => (
          <View style={styles.disabledTabButton}>
            <View style={styles.disabledContent}>
              {props.children}
            </View>
          </View>
        ),
        tabBarIcon: ({ size }) => (
          <View style={styles.disabledIconContainer}>
            <Ionicons name="settings" size={size} color="#9CA3AF" />
            <View style={styles.lockBadgeSmall}>
              <Ionicons name="lock-closed" size={8} color="#fff" />
            </View>
          </View>
        ),
      }}
      listeners={{
        tabPress: (e) => {
          // Prevent navigation
          e.preventDefault();
        },
      }}
    />
  </Tab.Navigator>
);

const HODTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === "Dashboard")
          iconName = focused ? "home" : "home-outline";
        else if (route.name === "Approvals")
          iconName = focused ? "checkmark-circle" : "checkmark-circle-outline";
        else if (route.name === "Reports")
          iconName = focused ? "bar-chart" : "bar-chart-outline";

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#4338CA",
      tabBarInactiveTintColor: "gray",
    })}
  >
    <Tab.Screen name="Dashboard" component={HODDashboard} />
    <Tab.Screen
      name="Approvals"
      component={HodLeaveApprovals}
      options={{ headerShown: false }}
    />
    <Tab.Screen name="Reports" component={HODDashboard} />
  </Tab.Navigator>
);

const TeacherTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === "Dashboard")
          iconName = focused ? "home" : "home-outline";
        else if (route.name === "My Class")
          iconName = focused ? "people" : "people-outline";
        else if (route.name === "Leave Requests")
          iconName = focused ? "document-text" : "document-text-outline";
        else if (route.name === "Approvals")
          iconName = focused ? "checkmark-circle" : "checkmark-circle-outline";
        else if (route.name === "Rejected") 
          iconName = focused ? "close-circle" : "close-circle-outline";
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#0D9488",
      tabBarInactiveTintColor: "gray",
    })}
  >
    <Tab.Screen name="Dashboard"
    options={{
                  headerShown: false,
                  title: "Dashboard",
                  headerStyle: { backgroundColor: "#7C3AED" },
                  headerTintColor: "#fff",
                }}
    component={TeacherDashboard} />
    <Tab.Screen name="My Class"
    options={{
                  headerShown: false,
                  title: "My Class",
                  headerStyle: { backgroundColor: "#7C3AED" },
                  headerTintColor: "#fff",
                }}
    component={StudentList} />    
    <Tab.Screen name="Leave Requests"
    options={{
                  headerShown: false,
                  title: "Leave Requests",
                  headerStyle: { backgroundColor: "#7C3AED" },
                  headerTintColor: "#fff",
                }}
    component={TeacherLeaveRequestsScreen} />                                        
    <Tab.Screen name="Approvals"
    options={{
                  headerShown: false,
                  title: "Approvals",
                  headerStyle: { backgroundColor: "#7C3AED" },
                  headerTintColor: "#fff",
                }}
    component={TeacherApprovalsScreen} />
    <Tab.Screen name="Rejected"
    options={{
                  headerShown: false,
                  title: "Rejected Leaves",
                  headerStyle: { backgroundColor: "#7C3AED" },
                  headerTintColor: "#fff",
                }}
    component={TeacherRejectedScreen} />
  </Tab.Navigator>
);

/* -------------------- MAIN APP NAVIGATOR -------------------- */

const AppNavigator = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
          />
        </>
      ) : user?.mustChangePassword ? (
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      ) : (
        <>
          {user?.role === USER_ROLES.ADMIN && (
            <>
              <Stack.Screen name="AdminMain" component={AdminTabs} />
              <Stack.Screen
                name="AddUser"
                component={AddUserScreen}
                options={{
                  headerShown: true,
                  title: "Add New User",
                  headerStyle: { backgroundColor: "#7C3AED" },
                  headerTintColor: "#fff",
                }}
              />
              <Stack.Screen
                name="BulkUpload"
                component={BulkUploadScreen}
                options={{
                  headerShown: true,
                  title: "Bulk Upload Users",
                  headerStyle: { backgroundColor: "#7C3AED" },
                  headerTintColor: "#fff",
                }}
              />
              <Stack.Screen
                name="EditUser"
                component={EditUserScreen}
                options={{
                  headerShown: false,
                  title: "Edit User",
                  headerStyle: { backgroundColor: "#7C3AED" },
                  headerTintColor: "#fff",
                }}
              />
              <Stack.Screen
                name="Departments"
                component={DepartmentsScreen}
                options={{
                  headerShown: true,
                  title: "Departments",
                  headerStyle: { backgroundColor: "#7C3AED" },
                  headerTintColor: "#fff",
                }}
              />
              <Stack.Screen
                name="AddEditDepartment"
                component={AddEditDepartmentScreen}
                options={{
                  headerShown: true,
                  title: "Department",
                  headerStyle: { backgroundColor: "#7C3AED" },
                  headerTintColor: "#fff",
                }}
              />
              <Stack.Screen
                name="LeaveTypes"
                component={LeaveTypesManagementScreen}
                options={{
                  headerShown: false,
                }}
              />
            </>
          )}

          {user?.role === USER_ROLES.HOD && (
            <>
              <Stack.Screen name="HODMain" component={HODTabs} />
              <Stack.Screen
                name="HodLeaveApprovals"
                component={HodLeaveApprovals}
                options={{ title: "Leave Approvals" }}
              />
              <Stack.Screen
                name="DepartmentTeachers"
                component={DepartmentTeachers}
              />
              <Stack.Screen
                name="DepartmentStudents"
                component={DepartmentStudents}
              />
            </>
          )}

          {user?.role === USER_ROLES.TEACHER && (
            <>
              <Stack.Screen name="TeacherMain" component={TeacherTabs} />
              <Stack.Screen
                name="TeacherProfile"
                component={TeacherProfile}
                options={{
                  headerShown: false,
                  title: "Profile",
                  headerStyle: { backgroundColor: "#0D9488" },
                  headerTintColor: "#fff",
                }}
              />
              <Stack.Screen
                name="StudentList"
                component={StudentList}
                options={{
                  headerShown: true,
                  title: "My Students",
                  headerStyle: { backgroundColor: "#0D9488" },
                  headerTintColor: "#fff",
                }}
              />
              <Stack.Screen
                name="StudentDetail"
                component={StudentDetail}
                options={{
                  headerShown: false,
                  title: "Student Details",
                  headerStyle: { backgroundColor: "#0D9488" },
                  headerTintColor: "#fff",
                }}
              />
              <Stack.Screen
                name="TeacherLeaveRequests"
                component={TeacherLeaveRequestsScreen}
                options={{
                  headerShown: false,
                  title: "Leave Requests",
                  headerStyle: { backgroundColor: "#0D9488" },
                  headerTintColor: "#fff",
                }}
              />
              <Stack.Screen
                name="TeacherLeaveHistory"
                component={TeacherLeaveHistoryScreen}
                options={{
                  headerShown: false,
                }}
              />
            </>
          )}

          {user?.role === USER_ROLES.STUDENT && (
            <>
              <Stack.Screen name="StudentMain" component={StudentTabs} />
              <Stack.Screen
                name="EditStudentProfile"
                component={EditStudentProfileScreen}
                options={{
                  headerShown: false,
                }}
              />
            </>
          )}

          {user?.role === USER_ROLES.STAFF && (
            <Stack.Screen name="StaffMain" component={StudentTabs} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  disabledTabContainer: {
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
  },
  iconWrapper: {
    position: "relative",
  },
  lockBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#9CA3AF",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  smallLockBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#9CA3AF",
    borderRadius: 6,
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  disabledTabLabel: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
  comingSoonRibbon: {
    position: "absolute",
    top: -8,
    right: -10,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comingSoonText: {
    color: "#fff",
    fontSize: 6,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  disabledTabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.7,
  },
  disabledContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  disabledIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadgeSmall: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#9CA3AF",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  disabledLabelContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  disabledLabel: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
});

export default AppNavigator;