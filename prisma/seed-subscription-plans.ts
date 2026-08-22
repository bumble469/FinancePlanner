import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const plans = [
    {
      code: "STARTER" as const,
      name: "Starter",
      description: "For individuals and small clubs getting started",
      maxProjects: 1,
      maxEvents: 1,
      maxTotalWorkItems: 2,
      maxMembersPerWorkItem: 20,
      maxDepartments: 10,
      maxTasksPerWorkItem: 250,
      features: {
        hardware: true,
        ticketing: true,
        stalls: true,
        advancedReports: true,
        prioritySupport: true,
      },
      prices: [
        { currency: "INR", billingInterval: "MONTHLY" as const, amount: 0 },
      ],
    },
    {
      code: "BASIC" as const,
      name: "Basic",
      description: "For small teams running up to 3 projects or events",
      maxProjects: 3,
      maxEvents: 3,
      maxTotalWorkItems: 5,
      maxMembersPerWorkItem: 40,
      maxDepartments: 20,
      maxTasksPerWorkItem: 500,
      features: {
        hardware: true,
        ticketing: true,
        stalls: true,
        advancedReports: true,
        prioritySupport: true,
      },
      prices: [
        { currency: "INR", billingInterval: "MONTHLY" as const, amount: 500 },
        { currency: "INR", billingInterval: "QUARTERLY" as const, amount: 1400 },
        { currency: "INR", billingInterval: "HALF_YEARLY" as const, amount: 2700 },
        { currency: "INR", billingInterval: "YEARLY" as const, amount: 5000 },
      ],
    },
    {
      code: "EMPLOYER" as const,
      name: "Employer",
      description: "For companies running multiple concurrent projects and events",
      maxProjects: 5,
      maxEvents: 5,
      maxTotalWorkItems: 10,
      maxMembersPerWorkItem: 100,
      maxDepartments: 40,
      maxTasksPerWorkItem: 750,
      features: {
        hardware: true,
        ticketing: true,
        stalls: true,
        advancedReports: true,
        prioritySupport: true,
      },
      prices: [
        { currency: "INR", billingInterval: "MONTHLY" as const, amount: 1500 },
        { currency: "INR", billingInterval: "QUARTERLY" as const, amount: 4200 },
        { currency: "INR", billingInterval: "HALF_YEARLY" as const, amount: 8100 },
        { currency: "INR", billingInterval: "YEARLY" as const, amount: 15000 },
      ],
    },
    {
      code: "MANAGER" as const,
      name: "Manager",
      description: "For agencies and organizations managing multiple teams",
      maxProjects: 10,
      maxEvents: 10,
      maxTotalWorkItems: 20,
      maxMembersPerWorkItem: 250,
      maxDepartments: 80,
      maxTasksPerWorkItem: 1250,
      features: {
        hardware: true,
        ticketing: true,
        stalls: true,
        advancedReports: true,
        prioritySupport: true,
      },
      prices: [
        { currency: "INR", billingInterval: "MONTHLY" as const, amount: 2500 },
        { currency: "INR", billingInterval: "QUARTERLY" as const, amount: 7000 },
        { currency: "INR", billingInterval: "HALF_YEARLY" as const, amount: 13500 },
        { currency: "INR", billingInterval: "YEARLY" as const, amount: 25000 },
      ],
    },
  ];

    for (const p of plans) {
    const plan = await prisma.subscriptionPlans.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        description: p.description,
        maxProjects: p.maxProjects,
        maxEvents: p.maxEvents,
        maxTotalWorkItems: p.maxTotalWorkItems,
        maxMembersPerWorkItem: p.maxMembersPerWorkItem,
        maxDepartments: p.maxDepartments,
        maxTasksPerWorkItem: p.maxTasksPerWorkItem,
        features: p.features,
      },
      create: {
        code: p.code,
        name: p.name,
        description: p.description,
        maxProjects: p.maxProjects,
        maxEvents: p.maxEvents,
        maxTotalWorkItems: p.maxTotalWorkItems,
        maxMembersPerWorkItem: p.maxMembersPerWorkItem,
        maxDepartments: p.maxDepartments,
        maxTasksPerWorkItem: p.maxTasksPerWorkItem,
        features: p.features,
      },
    });

    await prisma.planPrice.deleteMany({
      where: { planId: plan.id },
    });

    for (const price of p.prices) {
      await prisma.planPrice.upsert({
        where: { planId_currency_billingInterval: { planId: plan.id, currency: price.currency, billingInterval: price.billingInterval } },
        update: { amount: price.amount },
        create: { planId: plan.id, currency: price.currency, billingInterval: price.billingInterval, amount: price.amount },
      });
    }
  }

  console.log("Subscription plans seeded.");
}

main().finally(() => prisma.$disconnect());