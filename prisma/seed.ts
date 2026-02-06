import { PrismaClient } from "@prisma/client";
import { modulesData1 } from "./seed-data-1";
import { modulesData2 } from "./seed-data-2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── CLEAN EXISTING DATA ──────────────────────────────
  console.log("Cleaning existing data...");
  await prisma.milestoneAward.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.moduleProgress.deleteMany();
  await prisma.module.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.affiliateConversion.deleteMany();
  await prisma.affiliateClick.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.affiliate.deleteMany();
  await prisma.liveQuestion.deleteMany();
  await prisma.liveRsvp.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.course.deleteMany();

  // ─── ADMIN USER ───────────────────────────────────────
  console.log("Creating admin user...");
  const admin = await prisma.user.upsert({
    where: { email: "admin@lashacademy.com" },
    update: { role: "ADMIN", name: "Academy Admin" },
    create: {
      email: "admin@lashacademy.com",
      name: "Academy Admin",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`  Admin: ${admin.email} (${admin.id})`);

  // ─── COURSE ───────────────────────────────────────────
  console.log("Creating course...");
  const course = await prisma.course.create({
    data: {
      titleEn: "Professional Lash Extension Certification",
      titleEs: "Certificación Profesional de Extensiones de Pestañas",
      subtitleEn: "From fundamentals to business mastery",
      subtitleEs: "Desde los fundamentos hasta el dominio empresarial",
      descEn: "A comprehensive, professional certification course covering everything you need to know about lash extensions. From anatomy and safety to advanced techniques and business strategy — master the art and science of lash artistry.",
      descEs: "Un curso completo de certificación profesional que cubre todo lo que necesitas saber sobre extensiones de pestañas. Desde anatomía y seguridad hasta técnicas avanzadas y estrategia empresarial — domina el arte y la ciencia de las pestañas.",
      price: 0,
      published: true,
      passingScore: 80,
    },
  });
  console.log(`  Course: ${course.titleEn} (${course.id})`);

  // ─── MODULES, LESSONS, QUIZZES ────────────────────────
  const allModules = [...modulesData1, ...modulesData2];

  for (const modData of allModules) {
    console.log(`Creating Module ${modData.order}: ${modData.titleEn}...`);

    const mod = await prisma.module.create({
      data: {
        courseId: course.id,
        titleEn: modData.titleEn,
        titleEs: modData.titleEs,
        subtitleEn: modData.subtitleEn,
        subtitleEs: modData.subtitleEs,
        descEn: `Complete module covering ${modData.subtitleEn.toLowerCase()}.`,
        descEs: `Módulo completo que cubre ${modData.subtitleEs.toLowerCase()}.`,
        order: modData.order,
        isBonus: modData.isBonus,
      },
    });

    // Create lessons
    for (const lessonData of modData.lessons) {
      await prisma.lesson.create({
        data: {
          moduleId: mod.id,
          titleEn: lessonData.titleEn,
          titleEs: lessonData.titleEs,
          contentEn: lessonData.contentEn,
          contentEs: lessonData.contentEs,
          order: lessonData.order,
          videoProvider: "youtube",
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // placeholder
        },
      });
    }

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        moduleId: mod.id,
        titleEn: modData.quizTitleEn,
        titleEs: modData.quizTitleEs,
        descEn: `Test your knowledge of ${modData.titleEn.toLowerCase()}.`,
        descEs: `Pon a prueba tus conocimientos de ${modData.titleEs.toLowerCase()}.`,
      },
    });

    // Create questions
    for (const qData of modData.questions) {
      await prisma.question.create({
        data: {
          quizId: quiz.id,
          type: qData.type,
          questionEn: qData.questionEn,
          questionEs: qData.questionEs,
          scenarioEn: qData.scenarioEn || null,
          scenarioEs: qData.scenarioEs || null,
          options: qData.options,
          correctOptionId: qData.correctOptionId,
          explanationEn: qData.explanationEn,
          explanationEs: qData.explanationEs,
          order: qData.order,
        },
      });
    }

    console.log(`  ✓ ${modData.lessons.length} lessons, ${modData.questions.length} questions`);
  }

  // ─── MILESTONES ───────────────────────────────────────
  console.log("\nCreating milestones...");
  const milestones = [
    {
      triggerType: "FIRST_MODULE",
      titleEn: "Getting Started!",
      titleEs: "¡Comenzando!",
      messageEn: "You've completed your first module. Keep up the momentum!",
      messageEs: "¡Has completado tu primer módulo. ¡Mantén el impulso!",
      badgeEmoji: "🌟",
      nextStepEn: "Continue to the next module",
      nextStepEs: "Continúa al siguiente módulo",
    },
    {
      triggerType: "FIRST_QUIZ_PASS",
      titleEn: "Quiz Master!",
      titleEs: "¡Maestra del Examen!",
      messageEn: "You've passed your first quiz. You're on your way!",
      messageEs: "¡Has aprobado tu primer examen. ¡Vas por buen camino!",
      badgeEmoji: "🏆",
      nextStepEn: "Keep acing those quizzes",
      nextStepEs: "Sigue aprobando esos exámenes",
    },
    {
      triggerType: "QUARTER",
      titleEn: "25% Complete",
      titleEs: "25% Completado",
      messageEn: "A quarter of the way through — great progress!",
      messageEs: "¡Un cuarto del camino — gran progreso!",
      badgeEmoji: "💪",
      nextStepEn: "You're building a solid foundation",
      nextStepEs: "Estás construyendo una base sólida",
    },
    {
      triggerType: "HALF",
      titleEn: "Halfway There!",
      titleEs: "¡A Mitad de Camino!",
      messageEn: "50% of the course completed. You're doing amazing!",
      messageEs: "50% del curso completado. ¡Lo estás haciendo increíble!",
      badgeEmoji: "🔥",
      nextStepEn: "The advanced techniques await",
      nextStepEs: "Las técnicas avanzadas te esperan",
    },
    {
      triggerType: "THREE_QUARTER",
      titleEn: "Almost Done!",
      titleEs: "¡Casi Terminado!",
      messageEn: "75% completed — the finish line is near!",
      messageEs: "75% completado — ¡la meta está cerca!",
      badgeEmoji: "⭐",
      nextStepEn: "Just a few more modules to go",
      nextStepEs: "Solo faltan unos módulos más",
    },
    {
      triggerType: "COURSE_COMPLETE",
      titleEn: "Certified!",
      titleEs: "¡Certificada!",
      messageEn: "You've completed the entire course! Claim your certificate.",
      messageEs: "¡Has completado todo el curso! Reclama tu certificado.",
      badgeEmoji: "🎓",
      nextStepEn: "Download your certificate",
      nextStepEs: "Descarga tu certificado",
    },
  ];

  for (const m of milestones) {
    await prisma.milestone.create({
      data: {
        courseId: course.id,
        ...m,
      },
    });
  }
  console.log(`  ✓ ${milestones.length} milestones created`);

  // ─── SAMPLE LIVE SESSION ──────────────────────────────
  console.log("\nCreating sample live sessions...");
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(18, 0, 0, 0);

  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  nextMonth.setHours(18, 0, 0, 0);

  await prisma.liveSession.create({
    data: {
      titleEn: "Lash Fundamentals Q&A",
      titleEs: "Q&A de Fundamentos de Pestañas",
      descEn: "Ask anything about modules 1-4. Bring your questions about lash anatomy, safety procedures, products, and classic lash techniques!",
      descEs: "Pregunta cualquier cosa sobre los módulos 1-4. ¡Trae tus preguntas sobre anatomía de pestañas, procedimientos de seguridad, productos y técnicas clásicas!",
      scheduledAt: nextWeek,
      durationMin: 60,
      joinUrl: "https://zoom.us/j/example",
    },
  });

  await prisma.liveSession.create({
    data: {
      titleEn: "Advanced Techniques Workshop",
      titleEs: "Taller de Técnicas Avanzadas",
      descEn: "Deep dive into volume fans, mapping techniques, and troubleshooting retention issues. Perfect for students in modules 5-8.",
      descEs: "Profundización en abanicos de volumen, técnicas de mapeo y solución de problemas de retención. Perfecto para estudiantes en los módulos 5-8.",
      scheduledAt: nextMonth,
      durationMin: 90,
      joinUrl: "https://zoom.us/j/example2",
    },
  });
  console.log("  ✓ 2 live sessions created");

  // ─── SUMMARY ──────────────────────────────────────────
  const moduleCount = await prisma.module.count();
  const lessonCount = await prisma.lesson.count();
  const questionCount = await prisma.question.count();
  const quizCount = await prisma.quiz.count();

  console.log("\n✅ Seeding complete!");
  console.log(`  Modules: ${moduleCount}`);
  console.log(`  Lessons: ${lessonCount}`);
  console.log(`  Quizzes: ${quizCount}`);
  console.log(`  Questions: ${questionCount}`);
  console.log(`  Milestones: ${milestones.length}`);
  console.log(`\n  Admin login: admin@lashacademy.com`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
