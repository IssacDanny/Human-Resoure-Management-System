import axios from 'axios';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// ==========================================
// CONFIGURATION & STATE
// ==========================================
const API_URL = 'http://localhost:3000';
let accessToken: string | null = null;
let currentUser: any = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ==========================================
// UTILITIES
// ==========================================
const prompt = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const promptOptional = async (query: string): Promise<string | undefined> => {
  const answer = await prompt(query + ' (Leave blank to skip): ');
  return answer.trim() === '' ? undefined : answer.trim();
};

const getClient = () => {
  return axios.create({
    baseURL: API_URL,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
};

const handleError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response) {
    const apiError = error.response.data;
    console.error(`\n❌ API Error [${apiError.code || error.response.status}]: ${apiError.message || 'Unknown Error'}`);
    if (apiError.details) {
      console.error('   Details:');
      apiError.details.forEach((d: any) => console.error(`   - ${d.field}: ${d.issue}`));
    }
  } else {
    console.error('\n❌ Unexpected Error:', (error as Error).message);
  }
};

const requireAuth = (): boolean => {
  if (!accessToken) {
    console.log('\n⚠️  Please login first.');
    return false;
  }
  return true;
};

// ==========================================
// 1. AUTHENTICATION DOMAIN
// ==========================================
async function login() {
  console.log('\n--- 🔐 Authentication ---');
  const email = await prompt('Email: ');
  const password = await prompt('Password: ');

  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    accessToken = response.data.accessToken;
    currentUser = response.data.user;
    console.log(`\n✅ Login Successful! Welcome, ${currentUser.fullName} (${currentUser.role})`);
  } catch (error) {
    handleError(error);
  }
}

// ==========================================
// 2. EMPLOYEE DOMAIN
// ==========================================
async function employeeMenu() {
  if (!requireAuth()) return;
  console.log('\n--- 👥 Employee Management ---');
  console.log('1. List Employees');
  console.log('2. Get Employee Details');
  console.log('3. Create Employee (Admin)');
  console.log('4. Update Employee');
  console.log('0. Back to Main Menu');
  
  const choice = await prompt('Select: ');
  try {
    const client = getClient();
    switch (choice.trim()) {
      case '1':
        const listRes = await client.get('/employees');
        console.table(listRes.data.data.map((e: any) => ({ ID: e.id, Name: e.fullName, Role: e.role, Status: e.status })));
        break;
      case '2':
        const id = await prompt('Employee ID: ');
        const detailRes = await client.get(`/employees/${id}`);
        console.log('\n', detailRes.data);
        break;
      case '3':
        const newEmp = {
          fullName: await prompt('Full Name: '),
          workEmail: await prompt('Work Email: '),
          departmentId: await prompt('Department: '),
          jobTitle: await prompt('Job Title: '),
          basicSalary: Number(await prompt('Basic Salary: ')),
          joinDate: await prompt('Join Date (YYYY-MM-DD): '),
          role: await prompt('Role (ADMIN_HR/MANAGER/EMPLOYEE): '),
        };
        const createRes = await client.post('/employees', newEmp);
        console.log('\n✅ Employee Created:', createRes.data.id);
        break;
      case '4':
        const updateId = await prompt('Employee ID to update: ');
        const updateData: any = {};
        const phone = await promptOptional('New Phone');
        if (phone) updateData.phone = phone;
        const address = await promptOptional('New Address');
        if (address) updateData.address = address;
        
        if (Object.keys(updateData).length > 0) {
          const updateRes = await client.patch(`/employees/${updateId}`, updateData);
          console.log('\n✅ Employee Updated');
        } else {
          console.log('No updates provided.');
        }
        break;
      case '0': return;
      default: console.log('Invalid choice.');
    }
  } catch (error) { handleError(error); }
}

// ==========================================
// 3. ATTENDANCE DOMAIN
// ==========================================
async function attendanceMenu() {
  if (!requireAuth()) return;
  console.log('\n--- ⏰ Attendance Management ---');
  console.log('1. List Attendance Records');
  console.log('2. Record/Update Attendance (Admin)');
  console.log('0. Back to Main Menu');

  const choice = await prompt('Select: ');
  try {
    const client = getClient();
    switch (choice.trim()) {
      case '1':
        const month = await promptOptional('Filter by Month (YYYY-MM)');
        const url = month ? `/attendance?filter[month]=${month}` : '/attendance';
        const listRes = await client.get(url);
        console.table(listRes.data.data.map((a: any) => ({ Date: a.date.split('T')[0], EmpID: a.employeeId, Status: a.status, Days: a.workedDays })));
        break;
      case '2':
        const record = {
          employeeId: await prompt('Employee ID: '),
          date: await prompt('Date (YYYY-MM-DD): '),
          status: await prompt('Status (PRESENT/ABSENT/LATE/HALF_DAY): '),
          note: await promptOptional('Note'),
        };
        await client.post('/attendance', record);
        console.log('\n✅ Attendance Recorded');
        break;
      case '0': return;
      default: console.log('Invalid choice.');
    }
  } catch (error) { handleError(error); }
}

// ==========================================
// 4. LEAVE DOMAIN
// ==========================================
async function leaveMenu() {
  if (!requireAuth()) return;
  console.log('\n--- 🌴 Leave Management ---');
  console.log('1. List Leave Requests');
  console.log('2. Submit Leave Request');
  console.log('3. Approve/Reject Request (Manager)');
  console.log('0. Back to Main Menu');

  const choice = await prompt('Select: ');
  try {
    const client = getClient();
    switch (choice.trim()) {
      case '1':
        const listRes = await client.get('/leave-requests');
        console.table(listRes.data.data.map((l: any) => ({ ID: l.id, Type: l.leaveType, Status: l.status, Start: l.startDate.split('T')[0] })));
        break;
      case '2':
        const request = {
          leaveType: await prompt('Type (ANNUAL/SICK/UNPAID): '),
          startDate: await prompt('Start Date (YYYY-MM-DD): '),
          endDate: await prompt('End Date (YYYY-MM-DD): '),
          reason: await prompt('Reason: '),
        };
        await client.post('/leave-requests', request);
        console.log('\n✅ Leave Request Submitted');
        break;
      case '3':
        const reqId = await prompt('Leave Request ID: ');
        const status = await prompt('Decision (APPROVED/REJECTED): ');
        const payload: any = { status };
        if (status === 'REJECTED') {
          payload.rejectionReason = await prompt('Rejection Reason: ');
        }
        await client.patch(`/leave-requests/${reqId}`, payload);
        console.log(`\n✅ Request ${status}`);
        break;
      case '0': return;
      default: console.log('Invalid choice.');
    }
  } catch (error) { handleError(error); }
}

// ==========================================
// 5. PAYROLL DOMAIN
// ==========================================
async function payrollMenu() {
  if (!requireAuth()) return;
  console.log('\n--- 💰 Payroll Management ---');
  console.log('1. Generate Monthly Payroll (Admin)');
  console.log('2. View Payslips');
  console.log('3. Export Payroll Report (Excel)');
  console.log('0. Back to Main Menu');

  const choice = await prompt('Select: ');
  try {
    const client = getClient();
    switch (choice.trim()) {
      case '1':
        const genMonth = await prompt('Month (YYYY-MM): ');
        const days = await prompt('Standard Working Days (e.g., 22): ');
        const genRes = await client.post('/payroll-runs', { month: genMonth, standardWorkingDays: Number(days) });
        console.log(`\n✅ Payroll Generated! Processed ${genRes.data.processedCount} employees.`);
        break;
      case '2':
        const viewMonth = await prompt('Month (YYYY-MM): ');
        const listRes = await client.get(`/payslips?filter[month]=${viewMonth}`);
        console.table(listRes.data.data.map((p: any) => ({ EmpID: p.employeeId, NetSalary: p.netSalary, Generated: p.generatedAt.split('T')[0] })));
        break;
      case '3':
        const expMonth = await prompt('Month (YYYY-MM): ');
        console.log('Downloading...');
        const response = await client.get(`/payroll-reports/export?month=${expMonth}`, { responseType: 'arraybuffer' });
        const filepath = path.join(process.cwd(), `Payroll_Report_${expMonth}.xlsx`);
        fs.writeFileSync(filepath, response.data);
        console.log(`\n✅ Success! File saved to: ${filepath}`);
        break;
      case '0': return;
      default: console.log('Invalid choice.');
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof ArrayBuffer) {
      const decodedString = Buffer.from(error.response.data).toString('utf8');
      try {
        const jsonError = JSON.parse(decodedString);
        console.error(`\n❌ API Error[${jsonError.code}]: ${jsonError.message}`);
      } catch { console.error('\n❌ Failed to download file.'); }
    } else {
      handleError(error);
    }
  }
}

// ==========================================
// MAIN LOOP
// ==========================================
async function mainMenu() {
  console.log('\n=================================');
  console.log('🎩 HRMS - Terminal Client');
  console.log('=================================');
  if (currentUser) console.log(`👤 Logged in as: ${currentUser.email} (${currentUser.role})`);
  console.log('1. 🔐 Authentication (Login)');
  console.log('2. 👥 Employees');
  console.log('3. ⏰ Attendance');
  console.log('4. 🌴 Leave Requests');
  console.log('5. 💰 Payroll');
  console.log('0. Exit');
  console.log('---------------------------------');
  
  const choice = await prompt('Select a module (0-5): ');

  switch (choice.trim()) {
    case '1': await login(); break;
    case '2': await employeeMenu(); break;
    case '3': await attendanceMenu(); break;
    case '4': await leaveMenu(); break;
    case '5': await payrollMenu(); break;
    case '0':
      console.log('\nGood day, Sir. ☕\n');
      rl.close();
      return;
    default:
      console.log('\n⚠️  Invalid selection.');
  }

  mainMenu();
}

// Start the application
mainMenu();