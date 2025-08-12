# Workshop Request System Test Guide

## Overview
This system allows club members to submit workshop requests to their admin, and admins can approve or reject these requests.

## Test Scenarios

### 1. Club Member Request Submission

**Steps:**
1. Login as a club member
2. Navigate to "New Workshop" page
3. Verify you see the message about submitting requests
4. Click "Submit Workshop Request" button
5. Fill out the request form with:
   - Workshop Name: "Test Workshop"
   - Date: Select a future date
   - Time: Select a time
   - Location: "Test Location"
   - Topic: "Test Topic"
   - Description: "Test Description"
   - Max Participants: 20
6. Submit the request

**Expected Results:**
- ✅ Request form opens in modal
- ✅ All fields are required (except description and max participants)
- ✅ Success message appears after submission
- ✅ Request appears in "My Requests" section
- ✅ Statistics update to show new pending request

### 2. Admin Request Management

**Steps:**
1. Login as an admin from the same club
2. Navigate to "Workshop Requests" page
3. Verify you see all requests from club members
4. Find the pending request from step 1
5. Click "Approve" button
6. Enter approval message: "Great idea! Approved."
7. Verify the request status changes to "Approved"

**Expected Results:**
- ✅ Admin sees all requests from their club
- ✅ Statistics show pending requests
- ✅ Approve button works for pending requests
- ✅ Status badge changes to green "✅ Approved"
- ✅ Admin response appears in request details
- ✅ Statistics update to show approved request

### 3. Admin Request Rejection

**Steps:**
1. As admin, find another pending request
2. Click "Reject" button
3. Enter rejection reason: "Not feasible at this time"
4. Verify the request status changes to "Rejected"

**Expected Results:**
- ✅ Reject button works for pending requests
- ✅ Status badge changes to red "❌ Rejected"
- ✅ Admin response appears in request details
- ✅ Statistics update to show rejected request

### 4. Club Member Request Tracking

**Steps:**
1. Login as the club member who submitted requests
2. Navigate to "Workshop Requests" page
3. Verify you see your own requests only
4. Check the status of your requests

**Expected Results:**
- ✅ Club member sees only their own requests
- ✅ Statistics show their personal request counts
- ✅ Can see admin responses on approved/rejected requests
- ✅ Cannot see requests from other club members

### 5. Role-Based Access Control

**Test Club Member Access:**
1. Login as club member
2. Try to access "New Workshop" page
3. Verify you see the redirect message
4. Click "Submit Workshop Request" button
5. Verify you're taken to the requests page

**Test Admin Access:**
1. Login as admin
2. Navigate to "New Workshop" page
3. Verify you can create workshops directly
4. Navigate to "Workshop Requests" page
5. Verify you can approve/reject requests

**Expected Results:**
- ✅ Club members cannot create workshops directly
- ✅ Club members are redirected to request system
- ✅ Admins can create workshops directly
- ✅ Admins can manage all requests from their club

### 6. Cross-Club Security

**Steps:**
1. Login as admin from Club A
2. Try to approve a request from Club B
3. Verify the system prevents cross-club access

**Expected Results:**
- ✅ Admins can only manage requests from their own club
- ✅ Error message appears for cross-club attempts

### 7. Request Statistics

**Steps:**
1. Login as admin
2. Navigate to "Workshop Requests" page
3. Check the statistics cards
4. Submit a new request as club member
5. Verify statistics update

**Expected Results:**
- ✅ Statistics show total, pending, approved, rejected counts
- ✅ Statistics update in real-time
- ✅ Different statistics for admins vs club members

### 8. Form Validation

**Steps:**
1. Login as club member
2. Open request form
3. Try to submit without required fields
4. Verify validation works

**Expected Results:**
- ✅ Required fields are marked with asterisk
- ✅ Form won't submit without required fields
- ✅ Date and time fields have proper input types
- ✅ Number field for max participants

### 9. Responsive Design

**Steps:**
1. Test on different screen sizes
2. Verify modal and form work on mobile
3. Check statistics layout on tablets

**Expected Results:**
- ✅ Modal adapts to screen size
- ✅ Form fields stack properly on mobile
- ✅ Statistics cards reflow appropriately
- ✅ Request cards are readable on all devices

## API Endpoints Tested

### Backend Routes:
- `POST /api/workshop-requests/submit` - Submit request
- `GET /api/workshop-requests/requests` - Get requests
- `PUT /api/workshop-requests/approve/:id` - Approve request
- `PUT /api/workshop-requests/reject/:id` - Reject request
- `GET /api/workshop-requests/stats` - Get statistics

### Database Collections:
- `workshoprequests` - Stores all workshop requests
- `users` - User authentication and roles

## Error Handling

**Test Cases:**
1. Network errors during API calls
2. Invalid request data
3. Unauthorized access attempts
4. Missing authentication tokens

**Expected Results:**
- ✅ User-friendly error messages
- ✅ Graceful handling of network issues
- ✅ Proper authentication checks
- ✅ Form validation prevents invalid submissions

## Performance Considerations

**Test Cases:**
1. Multiple simultaneous requests
2. Large number of requests
3. Real-time statistics updates

**Expected Results:**
- ✅ Responsive UI during loading
- ✅ Efficient database queries
- ✅ Proper error handling for timeouts

## Security Features

**Test Cases:**
1. JWT token validation
2. Role-based access control
3. Club-based data isolation
4. Input sanitization

**Expected Results:**
- ✅ Only authenticated users can access
- ✅ Users can only see their club's data
- ✅ Admins can only manage their club's requests
- ✅ No SQL injection or XSS vulnerabilities 