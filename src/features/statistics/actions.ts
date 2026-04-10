"use server";

import { 
  StatsFilterValues, 
  OrganizationStat 
} from "./schemas";
import { StatisticsService } from "@/services/statistics";
import { ActionResult } from "@/types/action-result";

/**
 * 특정 시점 기준 전사 조직 통계 산출
 */
export async function getOrganizationStats({ targetDate }: StatsFilterValues): Promise<ActionResult<OrganizationStat[]>> {
  try {
    const stats = await StatisticsService.getOrganizationStats(targetDate);
    return {
      success: true,
      data: stats
    };
  } catch (error: any) {
    console.error("Stats Error:", error);
    return {
      success: false,
      error: error.message || "통계 집계 중 오류가 발생했습니다."
    };
  }
}

/**
 * 예산 정책 초기 데이터 생성 (Seed용)
 */
export async function seedBudgetPolicies(): Promise<ActionResult> {
  try {
    await StatisticsService.seedBudgetPolicies();
    return { success: true };
  } catch (error: any) {
    console.error("Seed Error:", error);
    return { success: false, error: "초기화 실패" };
  }
}
