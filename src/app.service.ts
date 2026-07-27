import { Injectable } from '@nestjs/common';
import { DataSource, In, LessThan } from 'typeorm';
import { TelegramService } from './utils/telegram.service';
import dayjs from 'dayjs';
import { InstallmentMonth } from './installment_months/installment_month.entity';
import { InstallmentMonthStatus } from './installment_months/enums/installmentMonthStatus.enum';
import Big from 'big.js';
import { InstallmentPlanStatus } from './installment_plans/enums/installmentPlanStatus.enum';

@Injectable()
export class AppService {
  constructor (
    private readonly dataSource: DataSource,
    private readonly telegramService: TelegramService
  ) {}
  
  async handleDailyOverdueCheck() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const today = dayjs().startOf('day').toDate();

      const overdueMonths = await queryRunner.manager.find(InstallmentMonth, {
        where: {
          status: In([InstallmentMonthStatus.Pending, InstallmentMonthStatus.PartiallyPaid]),
          installment_plan: { status: InstallmentPlanStatus.Active },
          due_date: LessThan(today),
        },
        relations: {
          installment_plan: {
            client: {
              person: true
            },
          },
        },
      });

      if (overdueMonths.length === 0) {
        // Notify telegram that there is no overdue installments:
        // await this.telegramService.sendAdminNotification('✅ *تقرير الأقساط اليومي:*\nلا يوجد أي متأخرات جديدة اليوم. كل شيء ممتاز!');
        await queryRunner.rollbackTransaction();
        return { message: 'No overdue installments found.' };
      }

      const idsToUpdate = overdueMonths.map(m => m.id);
      await queryRunner.manager.update(InstallmentMonth, idsToUpdate, {
        status: InstallmentMonthStatus.Overdue,  // Set all PENDING months to OVERDUE
      });

      let telegramMessage = `⚠️ *تقرير الأقساط المتأخرة اليوم (${dayjs().format('YYYY-MM-DD')}):*\n\n`;
      
      overdueMonths.forEach((month, index) => {
        const person = month.installment_plan.client.person;
        const clientName = person.first_name + ' ' + person.second_name + ' ' + person.third_name + ' ' + person.last_name;
        const phone = person.phone_number;
        const remaining = new Big(month.expected_amount).minus(new Big(month.paid_amount)).toNumber();

        telegramMessage += `${index + 1}. *العميل:* ${clientName}\n`;
        telegramMessage += `   *رقم الهاتف:* ${phone}\n`;
        telegramMessage += `   *المبلغ المتبقي:* ${remaining} EGP\n`;
        telegramMessage += `   *تاريخ الاستحقاق كان:* ${dayjs(month.due_date).format('YYYY-MM-DD')}\n\n`;
      });

      await this.telegramService.sendAdminNotification(telegramMessage);

      await queryRunner.commitTransaction();
      return { status: 'Success', updatedCount: overdueMonths.length };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.telegramService.sendAdminNotification('🚨 *خطأ فادح:* فشل تحديث الأقساط المتأخرة الليلة، يرجى فحص الـ Logs!');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
