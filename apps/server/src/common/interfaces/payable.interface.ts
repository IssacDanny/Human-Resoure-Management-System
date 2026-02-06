export interface IPayable {
  /**
   * The unique identifier of the entity (Employee).
   */
  id: string;

  /**
   * The base salary amount before deductions or taxes.
   * Used by the SalaryStrategy.
   */
  basicSalary: number;

  /**
   * A method to retrieve the number of workable days present in a given month.
   * @param month - The month in 'YYYY-MM' format.
   */
  getAttendanceDays(month: string): Promise<number>;
}