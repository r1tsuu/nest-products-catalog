import { ArrayNotEmpty, IsString } from 'class-validator';

export class CreateOrderDTO {
  @ArrayNotEmpty()
  @IsString({ each: true })
  productIds: string[];
}
