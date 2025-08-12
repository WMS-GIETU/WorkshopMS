# 🔧 Admin Check Troubleshooting Guide

## 🚨 **Issue: "Failed to check admin status. Please try again."**

### **Step 1: Check Backend Server Status**

**Make sure your backend server is running:**

1. **Open a new terminal/command prompt**
2. **Navigate to backend directory:**
   ```bash
   cd workshop-management-server
   ```
3. **Start the server:**
   ```bash
   npm start
   ```
4. **Expected output:**
   ```
   MongoDB connected
   Server running on port 5000
   ```

### **Step 2: Test Backend API Directly**

**Test the API endpoint manually:**

1. **Open browser or use curl:**
   ```
   http://localhost:5000/api/auth/check-admin/YOUR_CLUB_CODE
   ```
2. **Expected response:**
   ```json
   {
     "exists": false,
     "message": "No admin found for this club"
   }
   ```

### **Step 3: Check Browser Console**

**Open browser developer tools:**

1. **Press F12 or right-click → Inspect**
2. **Go to Console tab**
3. **Try the admin check again**
4. **Look for error messages or debug logs**

### **Step 4: Common Issues & Solutions**

#### **Issue 1: Backend Server Not Running**
- **Symptoms**: Network error, connection refused
- **Solution**: Start backend server with `npm start`

#### **Issue 2: CORS Error**
- **Symptoms**: CORS policy error in console
- **Solution**: Backend should have CORS enabled (already implemented)

#### **Issue 3: MongoDB Connection**
- **Symptoms**: Database connection error
- **Solution**: Check `.env` file has correct `MONGO_URI`

#### **Issue 4: Port Already in Use**
- **Symptoms**: "Port 5000 already in use"
- **Solution**: 
  ```bash
  1. Find process using port 5000
  2. Kill the process
  3. Restart server
  ```

### **Step 5: Debug Information**

**The code now includes debug logs:**

1. **Frontend logs** (in browser console):
   - Club code being checked
   - Request URL
   - Response status
   - Response data

2. **Backend logs** (in terminal):
   - Club code received
   - Database query result
   - Admin found/not found status

### **Step 6: Manual Testing Steps**

**Follow these steps to test:**

1. **Start backend server**
2. **Start frontend server**
3. **Open registration page**
4. **Enter a club code**
5. **Click "Check Admin"**
6. **Check both browser console and backend terminal**

### **Step 7: Expected Behavior**

**When working correctly:**

1. **Button shows "Checking..." while processing**
2. **Backend terminal shows debug logs**
3. **Browser console shows request/response logs**
4. **Result appears below club code field**
5. **Color-coded result (green/red)**

### **Step 8: If Still Not Working**

**Try these additional steps:**

1. **Clear browser cache**
2. **Restart both servers**
3. **Check network tab in browser dev tools**
4. **Verify MongoDB connection**
5. **Test with a simple club code (e.g., "TEST123")**

### **Step 9: Emergency Fix**

**If nothing works, try this simplified test:**

1. **Create a simple test file:**
   ```javascript
   // test-simple.js
   fetch('http://localhost:5000/api/auth/check-admin/TEST123')
     .then(response => response.json())
     .then(data => console.log(data))
     .catch(error => console.error(error));
   ```

2. **Run in browser console**

### **Step 10: Contact Support**

**If still having issues, provide:**

1. **Backend terminal output**
2. **Browser console errors**
3. **Network tab information**
4. **Steps you followed**

## ✅ **Success Indicators**

- ✅ Backend server running on port 5000
- ✅ MongoDB connected successfully
- ✅ API endpoint responds correctly
- ✅ Frontend can reach backend
- ✅ Admin check button works
- ✅ Results display properly

## 🎯 **Quick Fix Checklist**

- [ ] Backend server running (`npm start`)
- [ ] MongoDB connected
- [ ] Frontend server running
- [ ] No CORS errors
- [ ] Network requests successful
- [ ] Debug logs visible
- [ ] Results displaying correctly 