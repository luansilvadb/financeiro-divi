import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    const isSecure = process.env.SMTP_SECURE === 'true';
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async enviarEmailRecuperacao(to: string, nome: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${frontendUrl.replace(/\/+$/, '')}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Divi" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Recuperação de Senha - Divi',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Olá, ${nome}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">Você solicitou a redefinição de senha para a sua conta no Divi.</p>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">Clique no botão abaixo para escolher uma nova senha. Este link expira em 1 hora.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #f95738; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">Redefinir Minha Senha</a>
          </div>
          <p style="color: #999; font-size: 12px;">Se você não solicitou esta alteração, pode ignorar este e-mail.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="color: #bbb; font-size: 10px; text-align: center;">Divi © 2026</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`E-mail de recuperação de senha enviado com sucesso para ${to}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail de recuperação de senha para ${to}:`, error);
      throw new InternalServerErrorException('Erro ao enviar e-mail de recuperação.');
    }
  }
}
