# API Endpoint Mapping - Frontend to Backend

## Authentication Endpoints
- ✅ POST `/auth/login` - Login
- ✅ POST `/auth/refresh-token` - Refresh access token
- ✅ POST `/auth/change-password` - Change password
- ✅ POST `/auth/logout` - Logout
- ✅ GET `/auth/me` - Get current user
- ✅ POST `/auth/register-fcm` - Register FCM token
- ✅ PUT `/auth/update-profile` - Update user profile

## Admin Endpoints
- ✅ GET `/admin/users` - Get all users (with filters)
- ✅ POST `/admin/users` - Create new user
- ✅ GET `/admin/users/:id` - Get user by ID
- ✅ PUT `/admin/users/:id` - Update user
- ✅ PATCH `/admin/users/:id` - Update user (alternative)
- ✅ DELETE `/admin/users/:id` - Deactivate user
- ✅ POST `/admin/users/:id/reset-password` - Reset user password
- ✅ POST `/admin/users/bulk` - Bulk upload users
- ✅ GET `/admin/analytics` - Get admin analytics
- ✅ GET `/admin/departments` - Get all departments
- ✅ POST `/admin/departments` - Create department
- ✅ PUT `/admin/departments/:id` - Update department
- ✅ DELETE `/admin/departments/:id` - Delete department
- ✅ GET `/admin/leave-types` - Get all leave types
- ✅ POST `/admin/leave-types` - Create leave type
- ✅ PUT `/admin/leave-types/:id` - Update leave type
- ✅ DELETE `/admin/leave-types/:id` - Delete leave type

## Student Endpoints
- ✅ GET `/student/dashboard-stats` - Get student dashboard stats
- ✅ GET `/student/leave-history` - Get leave history
- ✅ GET `/student/leave-types` - Get available leave types
- ✅ POST `/student/leave-request` - Submit leave request
- ✅ GET `/student/download-letter/:leaveId` - Download leave letter
- ✅ GET `/student/leave-balance` - Get leave balance

## Teacher Endpoints
- ✅ GET `/teacher/dashboard-stats` - Get teacher dashboard stats
- ✅ GET `/teacher/leaves/pending` - Get pending leave requests
- ✅ GET `/teacher/profile` - Get teacher profile
- ✅ PATCH `/teacher/profile` - Update teacher profile
- ✅ POST `/teacher/leaves/:leaveId/approve` - Approve leave (UPDATED)
- ✅ POST `/teacher/leaves/:leaveId/reject` - Reject leave (UPDATED)
- ✅ GET `/teacher/leaves/:leaveId` - Get leave details
- ✅ GET `/teacher/leaves/history` - Get leave history
- ✅ GET `/teacher/students` - Get assigned students
- ✅ GET `/teacher/students/:studentId` - Get student details

## HOD Endpoints
- ✅ GET `/hod/stats` - Get HOD dashboard stats (UPDATED)
- ✅ GET `/hod/pending-approvals` - Get pending approvals (UPDATED)
- ✅ GET `/hod/department-overview` - Get department overview (UPDATED)
- ✅ POST `/hod/leaves/:leaveId/approve` - Approve leave (UPDATED)
- ✅ POST `/hod/leaves/:leaveId/reject` - Reject leave (UPDATED)
- ✅ GET `/hod/leaves/:leaveId` - Get leave details
- ✅ GET `/hod/leaves/history` - Get leave history
- ✅ GET `/hod/report` - Generate department report

## Notification Endpoints (May need backend implementation)
- ⚠️ POST `/notifications/subscribe` - Subscribe to notifications
- ⚠️ POST `/notifications/unsubscribe` - Unsubscribe from notifications

## Changes Made:
1. **BulkUploadScreen**: Fixed `/api/admin/users/bulk` → `/admin/users/bulk`
2. **TeacherDashboard**: 
   - Changed PATCH `/teacher/leaves/:id` → POST `/teacher/leaves/:id/approve`
   - Changed PATCH `/teacher/leaves/:id` → POST `/teacher/leaves/:id/reject`
   - Changed `remarks` to `reason` for reject endpoint
3. **HODDashboard**:
   - Changed `/hod/dashboard/stats` → `/hod/stats`
   - Changed `/hod/dashboard/pending-approvals` → `/hod/pending-approvals`
   - Changed `/hod/dashboard/department-overview` → `/hod/department-overview`
   - Changed `/hod/dashboard/approve-leave/:id` → `/hod/leaves/:id/approve`
   - Changed `/hod/dashboard/reject-leave/:id` → `/hod/leaves/:id/reject`
   - Changed `comments` to `remarks` for approve endpoint
4. **axiosConfig**: Fixed FormData handling to prevent Content-Type override

## Notes:
- All endpoints now properly prefixed with `/api` via API_BASE_URL
- FormData uploads (bulk upload) now work correctly
- Teacher and HOD approval/rejection endpoints use consistent POST method
- All endpoints match the backend route definitions
