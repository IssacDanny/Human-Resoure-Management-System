export declare enum Role {
    ADMIN_HR = "ADMIN_HR",
    MANAGER = "MANAGER",
    EMPLOYEE = "EMPLOYEE"
}
export declare class CreateEmployeeDto {
    fullName: string;
    workEmail: string;
    departmentId: string;
    jobTitle: string;
    basicSalary: number;
    joinDate: string;
    role: Role;
}
