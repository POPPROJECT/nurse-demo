import { z } from "zod";

export type FormState =
  | {
      error?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const SignupFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters long.",
    })
    .trim(),
  email: z.string().email({ message: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { message: "Be at least 8 characters long" })
    .regex(/[a-zA-Z]/, {
      message: "Contain at least one letter.",
    })
    .regex(/[0-9]/, {
      message: "Contain at least one number.",
    })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Contain at least one special character.",
    })
    .trim(),
});

export const LoginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password field must not be empty" }),
});

export enum Role {
  ADMIN = "ADMIN",
  APPROVER_IN = "APPROVER_IN",
  APPROVER_OUT = "APPROVER_OUT",
  STUDENT = "STUDENT",
  EXPERIENCE_MANAGER = "EXPERIENCE_MANAGER",
}

export type ExperienceStatus = "PENDING" | "CONFIRMED" | "CANCEL";

export interface RowData {
  name:
    | string
    | {
        prefix?: string;
        firstName?: string;
        lastName?: string;
      };
  email: string;
  role: "STUDENT" | "APPROVER_IN" | "APPROVER_OUT" | "EXPERIENCE_MANAGER";
  provider: "GOOGLE" | "LOCAL";
  studentId?: string;
  password?: string;
}

export interface SkippedEntry {
  name?: string;
  studentId?: string;
  provider?: "GOOGLE" | "LOCAL";
  role?: "STUDENT" | "APPROVER_IN" | "APPROVER_OUT" | "EXPERIENCE_MANAGER";
  email: string;
  reason: string;
}

export interface Book {
  id: number;
  title: string;
}

export interface Student {
  id: string;
  name: string;
  completed: number;
  total: number;
  actual: number;
  status: "completed" | "incomplete";
}

export interface Subcategory {
  id: number;
  name: string;
  percent: number;
  studentCount: number;
  doneStudentCount: number;
}

export interface CourseProgress {
  id: number;
  name: string;
  percent: number;
  studentCount: number;
  doneStudentCount: number;
  subcategories: Subcategory[];
}

export interface DashboardData {
  totalStudents: number;
  completedStudents: number;
  overallProgress: {
    required: number;
    done: number;
    percent: number;
  };
  courseProgress: CourseProgress[];
}
