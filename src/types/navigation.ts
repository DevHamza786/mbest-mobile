// Navigation Types
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Tutor: NavigatorScreenParams<TutorTabParamList>;
  Student: NavigatorScreenParams<StudentStackParamList>;
  Parent: NavigatorScreenParams<ParentTabParamList>;
  Profile: undefined; // Profile accessible from Header but not in bottom tabs
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type TutorTabParamList = {
  TutorDashboard: undefined;
  TutorCalendar: undefined;
  TutorStudents: undefined;
  TutorAssignments: undefined;
  Profile: undefined;
  Messages: undefined;
  Settings: undefined;
};

export type StudentTabParamList = {
  StudentDashboard: undefined;
  StudentClasses: undefined;
  StudentAssignments: undefined;
  StudentGrades: undefined;
  StudentAttendance: undefined;
  Messages: undefined;
  Settings: undefined;
};

export type StudentStackParamList = {
  StudentTabs: NavigatorScreenParams<StudentTabParamList>;
  ClassDetails: { classId: number };
  GradeDetails: { gradeId: number };
};

export type ParentTabParamList = {
  ParentDashboard: undefined;
  ParentClasses: undefined;
  ParentAssignments: undefined;
  ParentGrades: undefined;
  ParentAttendance: undefined;
  ParentBilling: undefined;
  Profile: undefined;
  Messages: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

