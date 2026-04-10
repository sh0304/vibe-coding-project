import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 관리자 계정 시딩 시작...');

  const adminEmail = 'admin@company.com';
  
  try {
    // 기존 관리자가 있는지 확인
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existing) {
      console.log('⚠️  admin 계정이 이미 존재합니다. 시딩을 건너뜁니다.');
      return;
    }

    // 관리자 계정 생성
    // 참고: 실제 운영 환경에서는 반드시 비밀번호를 해싱해야 합니다.
    // 여기서는 커스텀 인증의 로그인 로직에서 기대하는 형태(평문 등)로 저장합니다.
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: 'admin123',
        name: 'Admin',
        role: 'admin',
        employeeCode: 'EMP001' // 김대표 사번
      },
    });

    console.log('✅ 관리자 계정이 생성되었습니다!');
    console.log(`   아이디: ${admin.email}`);
    console.log('   비밀번호: admin123');

  } catch (err) {
    console.error('❌ Seed 오류:', err);
    throw err;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
