import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    
    try {
      await this.transporter.sendMail({
        from: `"Divi" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Recuperação de Senha - Divi',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Recuperação de Senha</h2>
            <p>Você solicitou a recuperação de senha para sua conta no Divi.</p>
            <p>Clique no link abaixo para redefinir sua senha. Este link expira em 1 hora.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #F87171; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Redefinir Senha
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Se você não solicitou isso, pode ignorar este e-mail com segurança.</p>
          </div>
        `,
      });
      this.logger.log(`E-mail de recuperação enviado para ${to}`);
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail para ${to}`, error);
      throw error;
    }
  }
}
