import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.ethereal.email',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      auth: {
        user: this.configService.get<string>('SMTP_USER') || 'test-user',
        pass: this.configService.get<string>('SMTP_PASS') || 'test-pass',
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: '"FlowAI Workspace" <noreply@flowai.com>',
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
    }
  }

  async sendWorkspaceInvitation(email: string, workspaceName: string, role: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const invitationLink = `${frontendUrl}/invitations?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: '"FlowAI Workspace" <noreply@flowai.com>',
        to: email,
        subject: `Invitation to join ${workspaceName}`,
        html: `
          <h1>Workspace Invitation</h1>
          <p>You have been invited to join the <strong>${workspaceName}</strong> workspace as a <strong>${role}</strong>.</p>
          <p>Click the link below to accept the invitation:</p>
          <a href="${invitationLink}">Accept Invitation</a>
        `,
      });
      this.logger.log(`Workspace invitation sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send workspace invitation to ${email}`, error);
    }
  }
}
