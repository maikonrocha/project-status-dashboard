import { z } from 'zod';

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(['OWNER', 'USER']),
  companyId: z.string(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
});

export const SignInResponseSchema = z.object({
  requiresVerification: z.boolean().optional(),
  accessToken: z.string().optional(),
  user: AuthUserSchema.optional(),
  message: z.string().optional(),
});

export const VerifyResponseSchema = z.object({
  accessToken: z.string(),
  user: AuthUserSchema,
});

export const SimpleResponseSchema = z.object({
  message: z.string().optional(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  epicId: z.string(),
  name: z.string(),
  squadName: z.string(),
  teamSize: z.number(),
  beginDate: z.string(),
  jiraBacklogFilterId: z.string(),
  jiraThroughputFilterId: z.string(),
  statusConfig: z.record(z.string(), z.unknown()),
  companyId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
