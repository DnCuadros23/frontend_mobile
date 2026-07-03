/** Navigation types (param lists) for React Navigation strong typing. */
import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type CasesStackParamList = {
  CasesList: { estado?: string } | undefined;
  CaseDetail: { id: number };
  CaseForm: { id?: number } | undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  EmergencyMap: { latitude: number; longitude: number } | undefined;
};

export type AppTabParamList = {
  Home:      NavigatorScreenParams<HomeStackParamList> | undefined;
  Cases:     NavigatorScreenParams<CasesStackParamList> | undefined;
  Assistant: undefined;
  Profile:   undefined;
};