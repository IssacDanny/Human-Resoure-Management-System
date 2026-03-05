# 🎩 Orientation: Your First Tour of the HRMS

Welcome, Gentlemen of the Frontend. I am **Dinh Gia Kiet**, and I shall be your guide. You are here to build the "Face" of this enterprise. Before you write a single React hook, let us walk through the system's primary workflows using the **Reference CLI**.

Please follow these steps precisely.

---

### 1. Ignition: Starting the Engines
Before we can interact, the "Brain" must be awake. Ensure your terminal is at the root of the monorepo and execute:

```bash
npm run dev
```
*Observe the logs. When you see `[NestApplication] Nest application successfully started`, the specialists are at their desks.*

---

### 2. The Secret Handshake (Authentication)
Every interaction (save for the first) requires a token of authority.

1.  **Open a second terminal** and enter the CLI:
    ```bash
    cd apps/cli
    npm start
    ```
2.  **Select Option 1 (Login).**
3.  **Enter the credentials:**
    *   **Email:** `admin@hrms.internal` (or the email you used in your seed/test)
    *   **Password:** `Welcome123!`
4.  **Technical Note for Devs:** Observe how the CLI now reports "✅ Login Successful." In your React app, you will store this `accessToken` in a secure state (or a cookie) and attach it to the `Authorization` header of every subsequent request.

---

### 3. Inspecting the Ranks (Employee Directory)
Now that you are "Known" to the system, let us fetch some data.

1.  **Select Option 2 (Employees), then Option 1 (List Employees).**
2.  **Observe the Table:** This is the `GET /employees` endpoint. 
3.  **Technical Note for Devs:** Notice the structure. The backend doesn't just send an array; it sends an object with a `data` key and a `pagination` key. Your UI must be prepared to handle this wrapper.

---

### 4. The Workflow: Requesting a Holiday (Leave Management)
This is where we demonstrate the **State Machine**.

1.  **Select Option 4 (Leave Requests), then Option 2 (Submit Leave Request).**
2.  **Enter the details:**
    *   **Type:** `ANNUAL`
    *   **Dates:** `2026-04-01` to `2026-04-05`
    *   **Reason:** "Attending the Royal Ascot."
3.  **Observe:** The request is created with a status of `PENDING`.
4.  **The Manager's Role:** Now, imagine you are the Manager. Select **Option 3 (Approve/Reject)**. Enter the ID of the request you just made and select `APPROVED`.
5.  **Technical Note for Devs:** This is a `PATCH` request. Notice how the UI must update to reflect the new status without a full page reload.

---

### 5. The Heavy Lifting: The Payroll Export
This is the most complex interaction. It involves binary data.

1.  **Select Option 5 (Payroll), then Option 1 (Generate Monthly Payroll).**
    *   Enter `2026-03` and `22` days. This triggers the Bursar's algorithm.
2.  **Select Option 3 (Export Payroll Report).**
    *   Enter `2026-03`.
3.  **Observe the CLI:** It says "Downloading..." and then confirms the file is saved to your disk.
4.  **Technical Note for Devs:** This is the most important lesson. When you call this endpoint in React (via Axios), you **must** set `responseType: 'arraybuffer'`. If you treat it like a standard JSON request, the browser will attempt to parse the Excel file as text, and the result will be a catastrophic mess of gibberish.

---

### 6. Handling the "Unpleasantries" (Error Handling)
A robust frontend is defined by how it handles failure.

1.  **Try to Login with a false password.**
2.  **Observe the CLI output:** It prints a standardized error: `❌ API Error [unauthorized]: Invalid credentials`.
3.  **Technical Note for Devs:** Every error from our server follows this schema. You should create a global "Toast" or "Notification" component in React that listens for these `code` and `message` fields to inform the user with elegance.

---

### Closing Remarks

Gentlemen, you have now seen the system in its entirety. The CLI code you just used is **open for your inspection** in `apps/cli/src/index.ts`. It is your "Cheat Sheet." Copy the logic, mimic the headers, and respect the contracts.