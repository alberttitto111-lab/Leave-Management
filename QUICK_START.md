# Quick Start Guide - After Frontend-Backend Connection Fix

## What Was Fixed

The frontend and backend were not communicating properly due to:
1. **Endpoint mismatches** - Frontend was calling old endpoint paths
2. **HTTP method mismatches** - Using PATCH instead of POST for approvals
3. **Parameter name mismatches** - Different field names (comments vs remarks, etc.)
4. **FormData handling** - Content-Type header was being overridden

All these issues have been resolved! ✅

## How to Test

### 1. Start the Backend Server
```bash
cd server
npm start
```
Server should start on `http://localhost:5000`

### 2. Update Frontend API URL (if needed)
Check `client/src/utils/constants.js`:
```javascript
export const API_BASE_URL = "http://YOUR_IP:5000/api";
```
Replace `YOUR_IP` with your computer's local IP address (e.g., `192.168.1.15`)

### 3. Start the Frontend App
```bash
cd client
npm start
# or
expo start
```

## Testing Each Feature

### Admin Features
1. **Login** as admin (userId: `ADM0001`, password: `ADM0001` or your admin credentials)
2. **Create User** - Test single user creation
3. **Bulk Upload** - Test CSV upload (this was broken, now fixed!)
4. **View Analytics** - Check dashboard stats
5. **Manage Departments** - Create/edit departments
6. **Manage Leave Types** - Create/edit leave types

### Teacher Features
1. **Login** as teacher
2. **View Dashboard** - Check stats load correctly
3. **Approve Leave** - Test the new POST endpoint
4. **Reject Leave** - Test with reason field
5. **View Students** - Check student list loads

### HOD Features
1. **Login** as HOD
2. **View Dashboard** - All three stats endpoints should work
3. **Approve Leave** - Test with remarks field
4. **Reject Leave** - Test with reason field
5. **View Department Overview** - Check data loads

### Student Features
1. **Login** as student
2. **View Dashboard** - Check stats
3. **Submit Leave Request** - Test leave submission
4. **View Leave History** - Check history loads
5. **Download Letter** - Test PDF download

## Common Issues & Solutions

### Issue: "Network Error" or "Failed to fetch"
**Solution**: 
- Check if backend server is running
- Verify API_BASE_URL in constants.js matches your server
- Make sure your phone/emulator can reach the server IP

### Issue: "401 Unauthorized"
**Solution**:
- Token might be expired, try logging out and back in
- Check if refresh token is working

### Issue: "404 Not Found"
**Solution**:
- This should be fixed now! If you still see it, check the endpoint in the error
- Compare with API_ENDPOINTS.md to verify correct path

### Issue: Bulk upload fails
**Solution**:
- Make sure CSV format matches the template
- Check file size is under 5MB
- Verify FormData is being sent (this was fixed in axiosConfig.js)

## File Upload Format (Bulk Upload)

CSV should have these columns:
```csv
userId,password,role,firstName,lastName,email,phone,departmentId,rollNumber,class,section,batchYear,fatherName,motherName,parentPhone
STU001,Pass123!,student,John,Doe,john@example.com,1234567890,DEPT_ID,101,10,A,2024,Mr. Doe,Mrs. Doe,9876543210
TCH001,Pass123!,teacher,Jane,Smith,jane@example.com,1234567891,DEPT_ID,,,,,,,
```

## API Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Errors return:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Next Steps

1. **Test thoroughly** - Go through each feature
2. **Check notifications** - Make sure FCM is configured
3. **Test edge cases** - Try invalid data, network issues, etc.
4. **Monitor logs** - Check both frontend and backend console for errors

## Need Help?

- Check `API_ENDPOINTS.md` for complete endpoint list
- Check `FRONTEND_BACKEND_FIX.md` for detailed changes
- Backend routes are in `server/routes/`
- Frontend API calls are in `client/src/screens/` and `client/src/services/`

## Firebase Setup (for notifications)

If notifications aren't working, make sure:
1. Firebase project is created
2. `serviceAccountKey.json` is in `server/config/`
3. Environment variables are set:
   - `FCM_PROJECT_ID`
   - `FCM_CLIENT_EMAIL`
   - `FCM_PRIVATE_KEY`
4. Frontend has Firebase configured in `app.json` or `google-services.json`

---

**Everything should now work correctly!** 🎉

If you encounter any issues, check the error message and compare the endpoint being called with the ones in `API_ENDPOINTS.md`.
