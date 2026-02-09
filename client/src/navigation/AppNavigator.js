import React from "react";
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

// HOD Screens
import HODDashboard from "../screens/HOD/HODDashboard";

// Teacher Screens
import TeacherDashboard from "../screens/teacher/TeacherDashboard";
import TeacherProfile from "../screens/teacher/TeacherProfile";
import StudentList from "../screens/teacher/StudentList";

// Student Screens
import StudentDashboard from "../screens/dashboard/StudentDashboard";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/* -------------------- ROLE TAB NAVIGATORS -------------------- */

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === "Dashboard")
          iconName = focused ? "home" : "home-outline";
        else if (route.name === "Users")
          iconName = focused ? "people" : "people-outline";
        else if (route.name === "Reports")
          iconName = focused ? "bar-chart" : "bar-chart-outline";
        else if (route.name === "Settings")
          iconName = focused ? "settings" : "settings-outline";
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#7C3AED",
      tabBarInactiveTintColor: "gray",
    })}
  >
    <Tab.Screen name="Dashboard" component={AdminDashboard} />
    <Tab.Screen name="Users" component={UserManagementScreen} />
    <Tab.Screen name="Reports" component={AdminDashboard} />
    <Tab.Screen name="Settings" component={AdminDashboard} />
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
    <Tab.Screen name="Approvals" component={HODDashboard} />
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
        else if (route.name === "Approvals")
          iconName = focused ? "checkmark-circle" : "checkmark-circle-outline";
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#0D9488",
      tabBarInactiveTintColor: "gray",
    })}
  >
    <Tab.Screen name="Dashboard" component={TeacherDashboard} />
    <Tab.Screen name="My Class" component={StudentList} />
    <Tab.Screen name="Approvals" component={TeacherDashboard} />
  </Tab.Navigator>
);

const StudentTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === "Dashboard")
          iconName = focused ? "home" : "home-outline";
        else if (route.name === "Leaves")
          iconName = focused ? "calendar" : "calendar-outline";
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
    <Tab.Screen name="Dashboard" component={StudentDashboard} />
    <Tab.Screen name="Leaves" component={StudentDashboard} />
    <Tab.Screen name="History" component={StudentDashboard} />
    <Tab.Screen name="Profile" component={StudentDashboard} />
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
                  headerShown: true,
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
            </>
          )}

          {user?.role === USER_ROLES.HOD && (
            <Stack.Screen name="HODMain" component={HODTabs} />
          )}

          {user?.role === USER_ROLES.TEACHER && (
            <>
              <Stack.Screen name="TeacherMain" component={TeacherTabs} />
              <Stack.Screen
                name="TeacherProfile"
                component={TeacherProfile}
                options={{
                  headerShown: true,
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
            </>
          )}

          {user?.role === USER_ROLES.STUDENT && (
            <Stack.Screen name="StudentMain" component={StudentTabs} />
          )}

          {user?.role === USER_ROLES.STAFF && (
            <Stack.Screen name="StaffMain" component={StudentTabs} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
