// navigation/TeacherNavigator.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import TeacherDashboard from "../screens/teacher/TeacherDashboard";
import TeacherProfile from "../screens/teacher/TeacherProfile";
import StudentList from "../screens/teacher/StudentList";
// Import any other screens you need here
// import MarkAttendance from "../screens/teacher/MarkAttendance";

const Stack = createStackNavigator();

const TeacherNavigator = () => (
  <Stack.Navigator
    initialRouteName="TeacherDashboard"
    screenOptions={{
      headerShown: false, // Keeping it false to match your dashboard design
    }}
  >
    <Stack.Screen name="TeacherDashboard" component={TeacherDashboard} />
    <Stack.Screen name="StudentList" component={StudentList} />
    <Stack.Screen name="TeacherProfile" component={TeacherProfile} />
    {/* Add other screens here */}
    {/* <Stack.Screen name="MarkAttendance" component={MarkAttendance} /> */}
  </Stack.Navigator>
);

export default TeacherNavigator;
