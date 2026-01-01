import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const conditionSchema = z.object({
  field: z.string(),
  operator: z.enum(["equals", "contains", "gt", "lt", "gte", "lte", "in", "notIn"]),
  value: z.unknown(),
});

const actionSchema = z.object({
  type: z.enum(["block_time", "add_break", "reschedule", "notify", "auto_decline"]),
  params: z.record(z.string(), z.unknown()).optional(),
});

export const ruleRouter = createTRPCRouter({
  // List rules
  list: protectedProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
        ruleType: z.enum(["PROTECTION", "AUTO_SCHEDULE", "BREAK", "CONDITIONAL"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.rule.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.ruleType ? { ruleType: input.ruleType } : {}),
        },
        include: {
          _count: {
            select: { executions: true },
          },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });
    }),

  // Get rule
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const rule = await ctx.db.rule.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          executions: {
            orderBy: { executedAt: "desc" },
            take: 20,
          },
        },
      });

      if (!rule) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return rule;
    }),

  // Create rule
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        ruleType: z.enum(["PROTECTION", "AUTO_SCHEDULE", "BREAK", "CONDITIONAL"]),
        triggerType: z.enum(["EVENT_CREATED", "EVENT_UPDATED", "TIME_BASED", "MANUAL"]),
        schedule: z.string().optional(),
        dayTypes: z.array(z.string()).optional(),
        conditions: z.array(conditionSchema),
        actions: z.array(actionSchema),
        priority: z.number().default(0),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.rule.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          conditions: input.conditions as object,
          actions: input.actions as object,
        },
      });
    }),

  // Update rule
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        ruleType: z.enum(["PROTECTION", "AUTO_SCHEDULE", "BREAK", "CONDITIONAL"]).optional(),
        triggerType: z.enum(["EVENT_CREATED", "EVENT_UPDATED", "TIME_BASED", "MANUAL"]).optional(),
        schedule: z.string().optional(),
        dayTypes: z.array(z.string()).optional(),
        conditions: z.array(conditionSchema).optional(),
        actions: z.array(actionSchema).optional(),
        priority: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, conditions, actions, ...rest } = input;

      const rule = await ctx.db.rule.findFirst({
        where: { id, userId: ctx.session.user.id },
      });

      if (!rule) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.rule.update({
        where: { id },
        data: {
          ...rest,
          ...(conditions ? { conditions: conditions as object } : {}),
          ...(actions ? { actions: actions as object } : {}),
        },
      });
    }),

  // Delete rule
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const rule = await ctx.db.rule.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!rule) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.rule.delete({
        where: { id: input.id },
      });
    }),

  // Toggle rule active state
  toggle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const rule = await ctx.db.rule.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!rule) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.rule.update({
        where: { id: input.id },
        data: { isActive: !rule.isActive },
      });
    }),

  // Execute rule manually
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const rule = await ctx.db.rule.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!rule) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Log execution
      const execution = await ctx.db.ruleExecution.create({
        data: {
          ruleId: input.id,
          triggeredBy: "MANUAL",
          success: true,
          message: "Rule executed manually",
          result: { triggered: true },
        },
      });

      // Update rule metadata
      await ctx.db.rule.update({
        where: { id: input.id },
        data: {
          lastTriggeredAt: new Date(),
          triggerCount: { increment: 1 },
        },
      });

      return execution;
    }),

  // Get rule templates
  getTemplates: protectedProcedure.query(() => {
    return [
      {
        id: "focus-time",
        name: "Temps de focus",
        description: "Protège des blocs de temps pour le travail concentré",
        ruleType: "PROTECTION",
        triggerType: "TIME_BASED",
        conditions: [
          { field: "time", operator: "gte", value: "09:00" },
          { field: "time", operator: "lte", value: "12:00" },
          { field: "dayType", operator: "equals", value: "WEEKDAY" },
        ],
        actions: [
          { type: "block_time", params: { duration: 180, label: "Focus time" } },
        ],
      },
      {
        id: "lunch-break",
        name: "Pause déjeuner",
        description: "Insère automatiquement une pause déjeuner",
        ruleType: "BREAK",
        triggerType: "TIME_BASED",
        conditions: [
          { field: "time", operator: "equals", value: "12:00" },
        ],
        actions: [
          { type: "add_break", params: { duration: 60, label: "Déjeuner" } },
        ],
      },
      {
        id: "meeting-buffer",
        name: "Buffer entre réunions",
        description: "Ajoute 15 min de buffer après chaque réunion",
        ruleType: "CONDITIONAL",
        triggerType: "EVENT_CREATED",
        conditions: [
          { field: "title", operator: "contains", value: "meeting" },
        ],
        actions: [
          { type: "add_break", params: { duration: 15, position: "after" } },
        ],
      },
    ];
  }),
});
