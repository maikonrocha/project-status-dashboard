import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    async sendVerificationCode(email: string, code: string): Promise<void> {
        // DEV: Log to console. Replace with real email provider (SendGrid, SES, etc.)
        console.log('');
        console.log('═══════════════════════════════════════════════════');
        console.log(`📧  VERIFICATION CODE for ${email}`);
        console.log(`    Code: ${code}`);
        console.log(`    Valid for 10 minutes`);
        console.log('═══════════════════════════════════════════════════');
        console.log('');
    }

    async sendInviteEmail(email: string, companyName: string, inviteToken: string): Promise<void> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
        const inviteLink = `${frontendUrl}/sign-up/complete?email=${encodeURIComponent(email)}&token=${inviteToken}`;

        console.log('');
        console.log('═══════════════════════════════════════════════════');
        console.log(`📧  INVITATION for ${email}`);
        console.log(`    Company: ${companyName}`);
        console.log(`    Link: ${inviteLink}`);
        console.log('═══════════════════════════════════════════════════');
        console.log('');
    }
}
