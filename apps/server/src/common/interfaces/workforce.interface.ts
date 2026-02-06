export interface IWorkforce {
  /**
   * The unique identifier of the employee.
   */
  id: string;

  /**
   * The department this employee belongs to.
   * Used for filtering and reporting.
   */
  departmentId: string;

  /**
   * The ID of the manager responsible for approving requests.
   * Can be null if the employee is the CEO or top-level admin.
   */
  managerId: string | null;
}