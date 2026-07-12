import { IsUUID, IsNumber, IsPositive, IsEnum } from 'class-validator';
import { PaymentType } from '../enums/paymentType.enum';

export class PaymentDTO {
  @IsUUID()
  installment_plan_id: string;

  @IsEnum(PaymentType)
  payment_type: PaymentType;

  @IsNumber()
  @IsPositive()
  paid_amount: number;
}

export class UnpayDTO {
  @IsUUID()
  installment_plan_id: string;
}