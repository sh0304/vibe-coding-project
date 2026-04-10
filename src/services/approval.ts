import { prisma } from "@/lib/prisma";
import { ApprovalStatus, ApprovalStepStatus } from "@/features/approval/schemas";
import { revalidatePath } from "next/cache";

/**
 * 결재선 구성을 위한 인터페이스
 */
export interface ApproverInfo {
  stepOrder: number;
  role: string;
  name: string;
  position: string;
  employeeCode: string;
}

/**
 * 결재 시스템 관련 비즈니스 서비스
 */
export const ApprovalService = {
  /**
   * 기안자의 직급과 부서에 따른 결재선을 조회합니다.
   */
  async getApprovalLine(employeeCode: string): Promise<ApproverInfo[]> {
    // 1. 기안자 조회
    const employee = await prisma.employee.findFirst({
      where: { employeeCode, isActive: true },
    });

    if (!employee) throw new Error("사원 정보를 찾을 수 없습니다.");

    // 2. 부서 및 직급 정보 조회
    const [organization, position] = await Promise.all([
      prisma.organization.findFirst({
        where: { code: employee.organizationCode, isActive: true }
      }),
      prisma.position.findUnique({
        where: { code: employee.position }
      })
    ]);

    if (!organization || !position) {
      throw new Error("부서 또는 직급 정보를 찾을 수 없습니다.");
    }

    const steps: ApproverInfo[] = [];

    // 1차 결재자 선정 (소속 팀장)
    if (position.approvalGroup === "GENERAL") {
      const teamLead = await prisma.employee.findFirst({
        where: { 
          organizationCode: employee.organizationCode, 
          isActive: true,
          position: "POS_TEAM_LEAD" 
        }
      });
      
      if (teamLead) {
        const leadPos = await prisma.position.findUnique({ where: { code: teamLead.position } });
        steps.push({
          stepOrder: 1,
          role: "TEAM_LEAD",
          name: teamLead.name,
          position: leadPos?.name || "팀장",
          employeeCode: teamLead.employeeCode
        });
      }
    } 
    // 기안자가 팀장인 경우 (본부장 조회)
    else if (position.approvalGroup === "TEAM_LEAD") {
      if (organization.parentCode) {
        const deptHead = await prisma.employee.findFirst({
          where: {
            organizationCode: organization.parentCode,
            isActive: true,
            position: "POS_DEPT_HEAD"
          }
        });
        
        if (deptHead) {
          const headPos = await prisma.position.findUnique({ where: { code: deptHead.position } });
          steps.push({
            stepOrder: 1,
            role: "DEPT_HEAD",
            name: deptHead.name,
            position: headPos?.name || "본부장",
            employeeCode: deptHead.employeeCode
          });
        }
      }
    }

    // 최종 결재자 (인사팀장)
    const hrTeamLead = await prisma.employee.findFirst({
      where: {
        organizationCode: "ORG_HR_TEAM",
        isActive: true,
        position: "POS_TEAM_LEAD"
      }
    });

    if (hrTeamLead) {
      const hrPos = await prisma.position.findUnique({ where: { code: hrTeamLead.position } });
      steps.push({
        stepOrder: steps.length + 1,
        role: "HR_MANAGER",
        name: hrTeamLead.name,
        position: hrPos?.name || "인사팀장",
        employeeCode: hrTeamLead.employeeCode
      });
    }

    return steps;
  },

  /**
   * 결재 실 본문을 생성하고 결재선을 등록합니다 (트랜잭션)
   */
  async submitWithTransaction(params: {
    category: string;
    title: string;
    content: string;
    authorCode: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { category, title, content, authorCode, startDate, endDate } = params;

    return await prisma.$transaction(async (tx) => {
      const author = await tx.employee.findFirst({
        where: { employeeCode: authorCode, isActive: true },
      });

      if (!author) throw new Error("기안자 정보를 찾을 수 없습니다.");

      const [org, pos] = await Promise.all([
        tx.organization.findFirst({ where: { code: author.organizationCode, isActive: true } }),
        tx.position.findUnique({ where: { code: author.position } })
      ]);

      // 결재선 조회 (서비스 로직 재사용 가능)
      const line = await this.getApprovalLine(authorCode);
      if (line.length === 0) throw new Error("결재선 구성원이 존재하지 않습니다.");

      // 1. 결재 문서 생성
      const doc = await tx.approval.create({
        data: {
          category,
          title,
          content,
          authorEmployeeCode: author.employeeCode,
          snapshotAuthorName: author.name,
          snapshotOrgName: org?.name || "Unknown",
          snapshotPosition: pos?.name || "Unknown",
          snapshotApproverLine: JSON.stringify(line),
          startDate,
          endDate,
          status: ApprovalStatus.PENDING,
        }
      });

      // 2. 결재 단계 생성
      await Promise.all(line.map(step => 
        tx.approvalStep.create({
          data: {
            approvalId: doc.id,
            stepOrder: step.stepOrder,
            role: step.role,
            snapshotApproverName: step.name,
            snapshotApproverPosition: step.position,
            approverEmployeeCode: step.employeeCode,
            status: ApprovalStepStatus.WAITING,
          }
        })
      ));

      return doc;
    });
  },

  /**
   * 결재 단계를 처리하고 문서 상태를 업데이트합니다 (트랜잭션)
   */
  async processStep(params: {
    approvalId: string;
    stepOrder: number;
    employeeCode: string;
    status: "APPROVED" | "REJECTED";
    comment?: string;
  }) {
    const { approvalId, stepOrder, employeeCode, status, comment } = params;

    return await prisma.$transaction(async (tx) => {
      // 1. 현재 결재 단계 확인
      const currentStep = await tx.approvalStep.findFirst({
        where: { approvalId, stepOrder },
      });

      if (!currentStep) throw new Error("결재 단계를 찾을 수 없습니다.");
      if (currentStep.approverEmployeeCode !== employeeCode) {
        throw new Error("결재 권한이 없습니다.");
      }
      if (currentStep.status !== ApprovalStepStatus.WAITING) {
        throw new Error("이미 처리가 완료된 결재입니다.");
      }

      // 2. 현재 단계 업데이트
      await tx.approvalStep.update({
        where: { id: currentStep.id },
        data: {
          status: status === "APPROVED" ? ApprovalStepStatus.APPROVED : ApprovalStepStatus.REJECTED,
          comment,
          actionAt: new Date(),
        }
      });

      // 3. 다음 단계 및 전체 상태 결정
      const nextStep = await tx.approvalStep.findFirst({
        where: { approvalId, stepOrder: stepOrder + 1 },
      });

      let finalStatus: string = ApprovalStatus.IN_PROGRESS;

      if (status === "REJECTED") {
        finalStatus = ApprovalStatus.REJECTED;
      } else if (!nextStep) {
        finalStatus = ApprovalStatus.APPROVED;
      }

      // 4. 메인 문서 상태 업데이트
      const updatedDoc = await tx.approval.update({
        where: { id: approvalId },
        data: { status: finalStatus as any }
      });

      return updatedDoc;
    });
  }
};
