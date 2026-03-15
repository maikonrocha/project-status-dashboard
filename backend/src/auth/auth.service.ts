import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  // ─── Owner Sign-Up ────────────────────────────────────────────────────
  async signUpOwner(
    name: string,
    email: string,
    password: string,
    companyName: string,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const company = await this.prisma.company.create({
      data: { name: companyName },
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'OWNER',
        isVerified: false,
        companyId: company.id,
      },
    });

    await this.generateAndSendCode(email);

    return {
      message: 'Account created. Please verify your email.',
      userId: user.id,
      email: user.email,
    };
  }

  // ─── Complete Invited User Sign-Up ────────────────────────────────────
  async completeSignUp(email: string, name: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException(
        'Invitation not found. Please ask your admin to re-invite you.',
      );
    }

    if (user.passwordHash) {
      throw new BadRequestException(
        'This account has already been set up. Please sign in.',
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await this.prisma.user.update({
      where: { email },
      data: { name, passwordHash },
    });

    await this.generateAndSendCode(email);

    return {
      message: 'Account completed. Please verify your email.',
      email,
    };
  }

  // ─── Sign In ──────────────────────────────────────────────────────────
  async signIn(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isVerified) {
      // Re-send code automatically
      await this.generateAndSendCode(email);
      return {
        requiresVerification: true,
        email: user.email,
        message: 'Please verify your email first. A new code has been sent.',
      };
    }

    const token = this.createToken(user);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
      },
    };
  }

  // ─── Verify Code ──────────────────────────────────────────────────────
  async verifyCode(email: string, code: string) {
    const record = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    // Mark code as used
    await this.prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    });

    // Mark user as verified
    const user = await this.prisma.user.update({
      where: { email },
      data: { isVerified: true },
      include: { company: true },
    });

    const token = this.createToken(user);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
      },
    };
  }

  // ─── Resend Code ──────────────────────────────────────────────────────
  async resendCode(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.isVerified) {
      throw new BadRequestException('This account is already verified.');
    }

    await this.generateAndSendCode(email);

    return { message: 'A new verification code has been sent.' };
  }

  // ─── Invite User ──────────────────────────────────────────────────────
  async inviteUser(ownerUserId: string, email: string) {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerUserId },
      include: { company: true },
    });

    if (!owner || owner.role !== 'OWNER') {
      throw new UnauthorizedException('Only owners can invite users.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    // Create skeleton user (no password, no name)
    const user = await this.prisma.user.create({
      data: {
        email,
        role: 'USER',
        isVerified: false,
        companyId: owner.companyId,
      },
    });

    // Generate an invite token (simple JWT with the email)
    const inviteToken = this.jwt.sign(
      { email, companyId: owner.companyId },
      { expiresIn: '7d' },
    );

    await this.mail.sendInviteEmail(email, owner.company.name, inviteToken);

    return {
      message: `Invitation sent to ${email}.`,
      userId: user.id,
    };
  }

  // ─── Get Current User ─────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
      isVerified: user.isVerified,
    };
  }

  // ─── Get Company Users (Owner only) ────────────────────────────────────
  async getCompanyUsers(companyId: string) {
    return await this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────
  private createToken(user: {
    id: string;
    email: string;
    role: string;
    companyId: string;
  }): string {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });
  }

  private async generateAndSendCode(email: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unused codes for this email
    await this.prisma.verificationCode.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    await this.prisma.verificationCode.create({
      data: { email, code, expiresAt },
    });

    await this.mail.sendVerificationCode(email, code);
  }
}
