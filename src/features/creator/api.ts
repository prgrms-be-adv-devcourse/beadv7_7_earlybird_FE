import { apiClient } from "../../shared/api/client";
import { USER_SERVICE } from "../../shared/api/endpoints";
import { useAuthStore } from "../../shared/auth/authStore";
import type { ApiResponse } from "../../shared/types/ApiResponse";
import type { AuthSession } from "../auth/types";
import type { CreatorApplication, SubmitCreatorApplicationPayload } from "./types";

const STORAGE_KEY = "earlybird_creator_applications_v1";

function loadApplications(): CreatorApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveApplications(apps: CreatorApplication[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch (err) {
    console.error("Failed to persist creator applications to localStorage", err);
  }
}

export async function submitCreatorApplication(payload: SubmitCreatorApplicationPayload): Promise<CreatorApplication> {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error("로그인이 필요한 서비스입니다.");
  }

  const apps = loadApplications();
  const existingIndex = apps.findIndex((a) => a.userId === user.id);

  const newApp: CreatorApplication = {
    id: existingIndex >= 0 ? apps[existingIndex].id : Date.now(),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userPhone: (user as any).phoneNumber || "010-0000-0000",
    bankName: payload.bankName,
    bankCode: payload.bankCode,
    accountNumber: payload.accountNumber,
    accountHolder: payload.accountHolder,
    creatorName: payload.creatorName,
    category: payload.category,
    introduction: payload.introduction,
    businessNumber: payload.businessNumber,
    portfolioUrl: payload.portfolioUrl,
    status: "PENDING",
    appliedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    apps[existingIndex] = newApp;
  } else {
    apps.unshift(newApp);
  }

  saveApplications(apps);
  return newApp;
}

export async function fetchMyCreatorApplication(): Promise<CreatorApplication | null> {
  const user = useAuthStore.getState().user;
  if (!user) return null;

  const apps = loadApplications();
  const found = apps.find((a) => a.userId === user.id);
  return found || null;
}

export async function fetchCreatorApplications(): Promise<CreatorApplication[]> {
  const apps = loadApplications();
  return apps;
}

export async function approveCreatorApplication(applicationId: number): Promise<CreatorApplication> {
  const apps = loadApplications();
  const target = apps.find((a) => a.id === applicationId);
  if (!target) {
    throw new Error("해당 창작자 신청 내역을 찾을 수 없습니다.");
  }

  target.status = "APPROVED";
  target.reviewedAt = new Date().toISOString();
  target.rejectReason = undefined;
  saveApplications(apps);

  // 백엔드 creator_profiles 등록(/api/v1/users/me/creator) 후 role 승격(/api/v1/users/me/role)으로
  // 새 JWT(role=CREATOR)를 발급받는다. /me/creator 응답엔 새 토큰이 없어 role 승격 호출이 항상 필요하다.
  const currentUser = useAuthStore.getState().user;
  if (currentUser && currentUser.id === target.userId) {
    try {
      await apiClient.post("/api/v1/users/me/creator", {
        bankName: target.bankName,
        accountNumber: target.accountNumber,
        accountHolder: target.accountHolder,
      });
    } catch (err) {
      console.warn("Creator profile registration failed, proceeding to role upgrade anyway:", err);
    }

    const roleResponse = await apiClient.post<ApiResponse<AuthSession>>(
      USER_SERVICE.switchRole,
      { role: "CREATOR" }
    );
    const session = roleResponse.data.data;
    if (session) {
      useAuthStore.getState().setSession(session);
    }
  }

  return target;
}

export async function rejectCreatorApplication(applicationId: number, rejectReason: string): Promise<CreatorApplication> {
  const apps = loadApplications();
  const target = apps.find((a) => a.id === applicationId);
  if (!target) {
    throw new Error("해당 창작자 신청 내역을 찾을 수 없습니다.");
  }

  target.status = "REJECTED";
  target.rejectReason = rejectReason;
  target.reviewedAt = new Date().toISOString();
  saveApplications(apps);

  return target;
}

export async function cancelCreatorApplication(applicationId: number): Promise<void> {
  const apps = loadApplications();
  const next = apps.filter((a) => a.id !== applicationId);
  saveApplications(next);
}
