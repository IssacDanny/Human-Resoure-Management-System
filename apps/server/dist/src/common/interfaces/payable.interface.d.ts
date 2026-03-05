export interface IPayable {
    id: string;
    basicSalary: number;
    getAttendanceDays(month: string): Promise<number>;
}
